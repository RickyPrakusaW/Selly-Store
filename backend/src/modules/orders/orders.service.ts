import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlacklistType,
  BookingStatus,
  CancelledBy,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProofType,
  RefundStatus,
  StockType,
  VerificationStatus,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import { MailService } from '../../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RefundPolicyService } from './refund-policy.service';
import {
  AdminReasonDto,
  ForceCancelDto,
  OrderListQueryDto,
  ReassignBoardDto,
  RefundDoneDto,
  UpdateOrderStatusDto,
} from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly refundPolicy: RefundPolicyService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  async listMine(userId: string, query: OrderListQueryDto) {
    const where = { userId, ...(query.status ? { status: query.status } : {}) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, downPayment: true },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  async getMine(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        deliveryAddress: true,
        downPayment: true,
        bookings: { include: { board: true } },
        paymentProofs: {
          where: { retractedAt: null },
          select: {
            id: true,
            proofType: true,
            uploadedAt: true,
            verificationStatus: true,
            rejectedReason: true,
            verifiedAt: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return order;
  }

  async remaining(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        remainingAmount: true,
        status: true,
        finalPaymentDeadline: true,
      },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return order;
  }

  async cancelByCustomer(userId: string, orderId: string, reason?: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: orderId, userId },
          include: {
            items: { include: { product: true } },
            user: true,
            downPayment: true,
          },
        });
        if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
        const cancellable: OrderStatus[] = [
          OrderStatus.PENDING_PAYMENT,
          OrderStatus.DP_VERIFIED,
          OrderStatus.PENDING_FINAL_PAYMENT,
        ];
        if (!cancellable.includes(order.status)) {
          throw new ConflictException(
            'Pesanan ini sudah tidak dapat dibatalkan lagi oleh pelanggan',
          );
        }
        const cancelledAt = new Date();
        const paid = order.downPayment?.status === PaymentStatus.VERIFIED;
        const refund = paid
          ? this.refundPolicy.calculate(
              order.dpAmount,
              order.createdAt,
              cancelledAt,
            )
          : null;
        await this.releaseResources(tx, order);
        return tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt,
            cancelledBy: CancelledBy.CUSTOMER,
            cancelReason: reason,
            refundAmount: refund?.refundAmount,
            refundDeductionPct: refund?.deductionPct,
            refundStatus: refund ? RefundStatus.PENDING_REFUND : undefined,
          },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    this.notifications.admin('order_cancelled', {
      orderId,
      cancelledBy: 'customer',
      refundAmount: result.refundAmount?.toString() ?? null,
    });
    this.sendMailInBackground(
      result.user.email,
      'Seli Florist order cancelled',
      `Order ${orderId} was cancelled. Refund: ${result.refundAmount?.toString() ?? 'none'}.`,
    );
    return result;
  }

  async listAdmin(query: OrderListQueryDto) {
    const where = query.status ? { status: query.status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          downPayment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  async getAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phoneNumber: true },
        },
        items: true,
        deliveryAddress: true,
        downPayment: true,
        bookings: { include: { board: true } },
        paymentProofs: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async verifyDp(orderId: string, adminId: string) {
    const deadlineDays = this.config.get<number>('PELUNASAN_DEADLINE_DAYS', 3);
    const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        });
        if (!order || order.status !== OrderStatus.PENDING_PAYMENT)
          throw new ConflictException('Order is not awaiting DP verification');
        const proof = await tx.paymentProof.findFirst({
          where: {
            orderId,
            proofType: ProofType.DP,
            verificationStatus: VerificationStatus.PENDING,
            retractedAt: null,
          },
        });
        if (!proof)
          throw new BadRequestException('No active pending DP proof exists');
        await tx.paymentProof.update({
          where: { id: proof.id },
          data: {
            verificationStatus: VerificationStatus.APPROVED,
            verifiedByAdminId: adminId,
            verifiedAt: new Date(),
          },
        });
        await tx.downPayment.update({
          where: { orderId },
          data: { status: PaymentStatus.VERIFIED, verifiedAt: new Date() },
        });
        await tx.boardBooking.updateMany({
          where: { orderId, status: BookingStatus.SOFT_LOCKED },
          data: { expiresAt: deadline },
        });
        return tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PENDING_FINAL_PAYMENT,
            dpVerifiedAt: new Date(),
            finalPaymentDeadline: deadline,
          },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    this.notifications.admin('dp_verified', { orderId });
    this.sendMailInBackground(
      result.user.email,
      'Seli Florist DP verified',
      `Remaining amount: ${result.remainingAmount.toString()}. Deadline: ${deadline.toISOString()}.`,
    );
    return result;
  }

  async verifyFinal(orderId: string, adminId: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        });
        if (!order || order.status !== OrderStatus.PENDING_FINAL_PAYMENT)
          throw new ConflictException('Order is not awaiting final payment');
        const proof = await tx.paymentProof.findFirst({
          where: {
            orderId,
            proofType: ProofType.FINAL,
            verificationStatus: VerificationStatus.PENDING,
            retractedAt: null,
          },
        });
        if (!proof)
          throw new BadRequestException(
            'No active pending final-payment proof exists',
          );
        await tx.paymentProof.update({
          where: { id: proof.id },
          data: {
            verificationStatus: VerificationStatus.APPROVED,
            verifiedByAdminId: adminId,
            verifiedAt: new Date(),
          },
        });
        await tx.boardBooking.updateMany({
          where: { orderId, status: BookingStatus.SOFT_LOCKED },
          data: { status: BookingStatus.CONFIRMED, expiresAt: null },
        });
        return tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FULLY_PAID },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    this.notifications.admin('final_payment_verified', { orderId });
    this.sendMailInBackground(
      result.user.email,
      'Seli Florist payment complete',
      `Order ${orderId} is fully paid.`,
    );
    return result;
  }

  async reject(orderId: string, adminId: string, dto: AdminReasonDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: true } }, user: true },
        });
        const terminal: OrderStatus[] = [
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
          OrderStatus.REJECTED,
        ];
        if (!order || terminal.includes(order.status))
          throw new ConflictException('Order cannot be rejected');
        await this.releaseResources(tx, order);
        await tx.blacklist.upsert({
          where: {
            type_value: { type: BlacklistType.EMAIL, value: order.user.email },
          },
          update: {
            reason: dto.reason,
            blacklistedByAdminId: adminId,
            blacklistedAt: new Date(),
          },
          create: {
            type: BlacklistType.EMAIL,
            value: order.user.email,
            reason: dto.reason,
            blacklistedByAdminId: adminId,
          },
        });
        await tx.blacklist.upsert({
          where: {
            type_value: {
              type: BlacklistType.WA_NUMBER,
              value: order.waNumber,
            },
          },
          update: {
            reason: dto.reason,
            blacklistedByAdminId: adminId,
            blacklistedAt: new Date(),
          },
          create: {
            type: BlacklistType.WA_NUMBER,
            value: order.waNumber,
            reason: dto.reason,
            blacklistedByAdminId: adminId,
          },
        });
        return tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.REJECTED,
            cancelledAt: new Date(),
            cancelledBy: CancelledBy.ADMIN,
            cancelReason: dto.reason,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    this.notifications.admin('order_rejected', { orderId });
    return result;
  }

  async complete(orderId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: true } } },
        });
        if (!order) throw new ConflictException('Order not found');

        const isFullyPaid =
          order.status === OrderStatus.FULLY_PAID ||
          (order.remainingAmount &&
            new Prisma.Decimal(order.remainingAmount).equals(0));

        if (!isFullyPaid) {
          throw new ConflictException(
            'Pesanan hanya dapat diselesaikan (COMPLETED) setelah pelunasan diverifikasi / lunas',
          );
        }

        if (!order.stockReservationClosed) {
          for (const item of order.items) {
            if (item.product.stockType === StockType.READY_STOCK) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQty: { decrement: item.qty },
                  reservedQty: { decrement: item.qty },
                },
              });
            }
          }
        }
        return tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.COMPLETED, stockReservationClosed: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async process(orderId: string) {
    const processable: OrderStatus[] = [
      OrderStatus.DP_VERIFIED,
      OrderStatus.PENDING_FINAL_PAYMENT,
      OrderStatus.FULLY_PAID,
    ];
    const result = await this.prisma.order.updateMany({
      where: { id: orderId, status: { in: processable } },
      data: { status: OrderStatus.PROCESSING },
    });
    if (!result.count) {
      throw new ConflictException(
        'Pesanan hanya dapat diproses setelah DP (50%) atau pembayaran diverifikasi',
      );
    }
    return this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  }

  async forceCancel(orderId: string, dto: ForceCancelDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { product: true } },
            user: true,
            downPayment: true,
          },
        });
        const terminal: OrderStatus[] = [
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
          OrderStatus.REJECTED,
        ];
        if (!order || terminal.includes(order.status))
          throw new ConflictException('Order cannot be cancelled');
        await this.releaseResources(tx, order);
        const paid = order.downPayment?.status === PaymentStatus.VERIFIED;
        return tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: CancelledBy.ADMIN,
            adminCancelNote: dto.adminCancelNote,
            refundAmount: paid ? order.dpAmount : undefined,
            refundDeductionPct: paid ? 0 : undefined,
            refundStatus: paid ? RefundStatus.PENDING_REFUND : undefined,
          },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    this.notifications.admin('order_force_cancelled', {
      orderId,
      refundAmount: result.refundAmount?.toString() ?? null,
    });
    this.sendMailInBackground(
      result.user.email,
      'Seli Florist order cancelled by store',
      `${dto.adminCancelNote}. Refund: ${result.refundAmount?.toString() ?? 'none'}.`,
    );
    return result;
  }

  async refundDone(orderId: string, dto: RefundDoneDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order || order.refundStatus !== RefundStatus.PENDING_REFUND)
      throw new ConflictException('Order has no pending refund');
    const result = await this.prisma.order.update({
      where: { id: orderId },
      data: { refundStatus: RefundStatus.REFUNDED, refundNote: dto.refundNote },
      include: { user: true },
    });
    this.sendMailInBackground(
      result.user.email,
      'Seli Florist refund completed',
      `Refund for order ${orderId} has been transferred.`,
    );
    return result;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    const isCancelledOrRejected =
      dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.REJECTED;

    const isCompleted = dto.status === OrderStatus.COMPLETED;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        ...(isCancelledOrRejected
          ? {
              cancelledAt: new Date(),
              cancelledBy: CancelledBy.ADMIN,
              ...(dto.note ? { adminCancelNote: dto.note } : {}),
            }
          : {}),
        ...(isCompleted ? { stockReservationClosed: true } : {}),
      },
    });
  }

  private sendMailInBackground(to: string, subject: string, text: string) {
    void this.mail.send(to, subject, text).catch(() => undefined);
  }

  async reassignBoard(
    orderId: string,
    dto: ReassignBoardDto,
    bookingId?: string,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          let targetBookingId = bookingId;
          if (!targetBookingId) {
            const firstBooking = await tx.boardBooking.findFirst({
              where: {
                orderId,
                status: {
                  in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED],
                },
              },
            });
            if (!firstBooking)
              throw new NotFoundException('Jadwal sewa aktif tidak ditemukan');
            targetBookingId = firstBooking.id;
          }
          const booking = await tx.boardBooking.findFirst({
            where: {
              id: targetBookingId,
              orderId,
              status: {
                in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED],
              },
            },
          });
          if (!booking)
            throw new NotFoundException('Jadwal sewa aktif tidak ditemukan');
          const board = await tx.boardInventory.findFirst({
            where: { id: dto.boardId, isActive: true, deletedAt: null },
          });
          if (!board) throw new NotFoundException('Unit papan tidak ditemukan');
          return tx.boardBooking.update({
            where: { id: targetBookingId },
            data: { boardId: dto.boardId },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictException('Board is already booked for this date');
      throw error;
    }
  }

  async cancelExpired(orderId: string, finalPayment: boolean) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { product: true } },
            user: true,
            downPayment: true,
            paymentProofs: {
              where: {
                verificationStatus: VerificationStatus.PENDING,
                retractedAt: null,
              },
              select: { proofType: true },
            },
          },
        });
        if (!order) return null;
        const expected = finalPayment
          ? OrderStatus.PENDING_FINAL_PAYMENT
          : OrderStatus.PENDING_PAYMENT;
        if (order.status !== expected) return null;
        if (
          !finalPayment &&
          order.downPayment?.status === PaymentStatus.PROOF_PENDING
        )
          return null;
        if (
          finalPayment &&
          order.paymentProofs.some(
            (proof) => proof.proofType === ProofType.FINAL,
          )
        )
          return null;
        await this.releaseResources(tx, order);
        const refund =
          finalPayment && order.downPayment?.status === PaymentStatus.VERIFIED
            ? this.refundPolicy.calculate(order.dpAmount, order.createdAt)
            : null;
        if (!finalPayment)
          await tx.downPayment.update({
            where: { orderId },
            data: { status: PaymentStatus.EXPIRED, expiredAt: new Date() },
          });
        return tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: CancelledBy.SYSTEM,
            cancelReason: finalPayment
              ? 'Final payment deadline expired'
              : 'DP deadline expired',
            refundAmount: refund?.refundAmount,
            refundDeductionPct: refund?.deductionPct,
            refundStatus: refund ? RefundStatus.PENDING_REFUND : undefined,
          },
          include: { user: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async releaseResources(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      stockReservationClosed: boolean;
      items: Array<{
        productId: string;
        qty: number;
        product: { stockType: StockType };
      }>;
    },
  ) {
    if (!order.stockReservationClosed) {
      for (const item of order.items) {
        if (item.product.stockType === StockType.READY_STOCK)
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedQty: { decrement: item.qty } },
          });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { stockReservationClosed: true },
      });
    }
    await tx.boardBooking.updateMany({
      where: {
        orderId: order.id,
        status: { in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED] },
      },
      data: { status: BookingStatus.CANCELLED, expiresAt: null },
    });
  }
}
