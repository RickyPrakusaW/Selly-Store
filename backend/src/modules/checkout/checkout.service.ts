import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlacklistType,
  BookingStatus,
  DeliveryType,
  OrderStatus,
  Prisma,
  StockType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationQueueService } from '../../common/notification-queue/notification-queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CheckoutDto,
  CheckoutItemDto,
  EstimateShippingDto,
} from './dto/checkout.dto';
import { ShippingService } from './shipping.service';

type ResolvedItem = {
  productId: string;
  variantId: string | null;
  qty: number;
  customNote?: string;
  bookingDate: Date | null;
  bookingEndDate: Date | null;
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipping: ShippingService,
    private readonly notifications: NotificationsService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  estimate(dto: EstimateShippingDto) {
    return this.shipping.estimate(dto);
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    const blocked = await this.prisma.blacklist.findFirst({
      where: {
        OR: [
          { type: BlacklistType.EMAIL, value: user.email },
          { type: BlacklistType.WA_NUMBER, value: dto.waNumber },
        ],
      },
    });
    if (blocked)
      throw new ForbiddenException('Proses checkout diblokir untuk akun atau nomor WA ini');

    const shipping = await this.shipping.estimate(dto);
    const requestedItems = dto.items?.length
      ? dto.items
      : await this.itemsFromCart(userId);
    if (!requestedItems.length) throw new BadRequestException('Keranjang belanja Anda masih kosong');

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await this.prisma.$transaction(
          (tx) => this.createOrder(tx, userId, dto, requestedItems, shipping),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 15000,
          },
        );
        this.notifications.admin('order_created', {
          orderId: result.id,
          status: result.status,
          total: result.total.toString(),
        });
        await Promise.all([
          this.notificationQueue.enqueue({
            kind: 'mail',
            to: user.email,
            subject: 'Pesanan Seli Florist berhasil dibuat',
            text: `Pesanan ${result.id} berhasil dibuat. DP ${result.dpAmount.toString()} harus dibayar sebelum ${result.dpDeadline.toISOString()}.`,
            idempotencyKey: `order-created:mail:${result.id}`,
          }),
          this.notificationQueue.enqueue({
            kind: 'whatsapp',
            target: dto.waNumber,
            message: `Pesanan Seli Florist ${result.id} berhasil dibuat. DP Rp${result.dpAmount.toString()} jatuh tempo ${result.dpDeadline.toISOString()}.`,
            idempotencyKey: `order-created:wa:${result.id}`,
          }),
        ]);
        return {
          id: result.id,
          orderId: result.id,
          dpAmount: result.dpAmount,
          remainingAmount: result.remainingAmount,
          dpDeadline: result.dpDeadline,
        };
      } catch (error) {
        lastError = error;
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2002', 'P2004', 'P2034'].includes(error.code)
        )
          throw error;
      }
    }
    throw new ConflictException(
      'Ketersediaan stok atau papan ucapan berubah saat proses checkout. Silakan coba beberapa saat lagi.',
      { cause: lastError },
    );
  }

  private async createOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CheckoutDto,
    requested: CheckoutItemDto[],
    shipping: { distanceKm: number; fee: number },
  ) {
    const pending = await tx.order.findFirst({
      where: { userId, status: OrderStatus.PENDING_PAYMENT },
    });
    if (pending) throw new ConflictException('Anda masih memiliki pesanan yang belum dibayar (menunggu DP)');
    const resolved = this.resolveItems(requested);
    const now = new Date();
    const dpDeadline = new Date(
      now.getTime() +
        Number(process.env.DP_DEADLINE_HOURS ?? 2) * 60 * 60 * 1000,
    );
    let subtotal = new Prisma.Decimal(0);
    let maxPoDays = 0;
    const snapshots = [];

    for (const item of resolved) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, deletedAt: null, isActive: true },
        include: {
          category: true,
          variants: {
            where: { id: item.variantId ?? undefined, deletedAt: null },
          },
          costs: {
            where: { effectiveDate: { lte: now } },
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
        },
      });
      if (!product)
        throw new NotFoundException(`Produk ${item.productId} tidak tersedia atau telah dihapus`);
      const variant = item.variantId
        ? product.variants.find((entry) => entry.id === item.variantId)
        : undefined;
      if (item.variantId && !variant)
        throw new BadRequestException('Varian produk yang dipilih tidak tersedia');
      if (
        product.stockType === StockType.READY_STOCK &&
        product.stockQty - product.reservedQty < item.qty
      ) {
        throw new ConflictException(`Stok produk ${product.name} tidak mencukupi`);
      }
      if (product.category.slug === 'papan_ucapan' && !item.bookingDate)
        throw new BadRequestException('Produk papan ucapan membutuhkan tanggal sewa (bookingDate)');
      if (
        product.category.slug !== 'papan_ucapan' &&
        (item.bookingDate || item.bookingEndDate)
      )
        throw new BadRequestException(
          'Tanggal sewa hanya dapat diisi untuk produk papan ucapan',
        );

      const unitPrice = product.basePrice.add(variant?.priceDelta ?? 0);
      subtotal = subtotal.add(unitPrice.mul(item.qty));
      maxPoDays = Math.max(maxPoDays, product.poDays ?? 0);
      snapshots.push({
        item,
        product,
        variant,
        unitPrice,
        costPrice: product.costs[0]?.costPrice ?? new Prisma.Decimal(0),
      });
    }

    const ongkir = new Prisma.Decimal(shipping.fee);
    const total = subtotal.add(ongkir);
    const dpAmount = total.mul(0.5).toDecimalPlaces(2);
    const remainingAmount = total.sub(dpAmount);
    const estimatedReadyDate = maxPoDays
      ? new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + maxPoDays,
          ),
        )
      : null;
    const order = await tx.order.create({
      data: {
        userId,
        waNumber: dto.waNumber,
        customerName: dto.customerName,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        deliveryType: dto.deliveryType,
        subtotal,
        ongkirFee: ongkir,
        total,
        dpAmount,
        remainingAmount,
        customTextRequest: dto.customTextRequest,
        estimatedReadyDate,
        dpDeadline,
        downPayment: { create: { amount: dpAmount, deadline: dpDeadline } },
        deliveryAddress:
          dto.deliveryType === DeliveryType.DELIVERY && dto.address
            ? {
                create: {
                  fullAddress: dto.address.fullAddress,
                  latitude: dto.address.latitude,
                  longitude: dto.address.longitude,
                  distanceKm: shipping.distanceKm,
                  ongkirCalculated: shipping.fee,
                },
              }
            : undefined,
      },
    });

    for (const snapshot of snapshots) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: snapshot.product.id,
          variantId: snapshot.variant?.id,
          qty: snapshot.item.qty,
          productNameSnapshot: snapshot.product.name,
          variantNameSnapshot: snapshot.variant?.variantName,
          customNoteSnapshot: snapshot.item.customNote,
          priceSnapshot: snapshot.unitPrice,
          costPriceSnapshot: snapshot.costPrice,
          bookingDate: snapshot.item.bookingDate,
          bookingEndDate: snapshot.item.bookingEndDate,
          estimatedReadyDate: snapshot.product.poDays
            ? new Date(
                Date.UTC(
                  now.getUTCFullYear(),
                  now.getUTCMonth(),
                  now.getUTCDate() + snapshot.product.poDays,
                ),
              )
            : null,
        },
      });
      if (snapshot.product.stockType === StockType.READY_STOCK) {
        await tx.product.update({
          where: { id: snapshot.product.id },
          data: { reservedQty: { increment: snapshot.item.qty } },
        });
      }
      if (
        snapshot.product.category.slug === 'papan_ucapan' &&
        snapshot.item.bookingDate
      ) {
        for (let count = 0; count < snapshot.item.qty; count += 1) {
          const board = await tx.boardInventory.findFirst({
            where: {
              isActive: true,
              deletedAt: null,
              bookings: {
                none: {
                  bookingStart: { lt: snapshot.item.bookingEndDate! },
                  bookingEnd: { gt: snapshot.item.bookingDate },
                  status: {
                    in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED],
                  },
                },
              },
            },
            orderBy: { id: 'asc' },
          });
          if (!board)
            throw new ConflictException(
              `No board is available for ${snapshot.item.bookingDate.toISOString().slice(0, 10)}–${snapshot.item.bookingEndDate!.toISOString().slice(0, 10)}`,
            );
          await tx.boardBooking.create({
            data: {
              boardId: board.id,
              bookingStart: snapshot.item.bookingDate,
              bookingEnd: snapshot.item.bookingEndDate!,
              status: BookingStatus.SOFT_LOCKED,
              userId,
              orderId: order.id,
              expiresAt: dpDeadline,
            },
          });
        }
      }
    }
    await tx.cartItem.deleteMany({ where: { userId } });
    return order;
  }

  private resolveItems(items: CheckoutItemDto[]): ResolvedItem[] {
    const keys = new Set<string>();
    return items.map((item) => {
      const bookingDate = item.bookingDate
        ? new Date(`${item.bookingDate.slice(0, 10)}T00:00:00.000Z`)
        : null;
      const bookingEndDate = bookingDate
        ? item.bookingEndDate
          ? new Date(`${item.bookingEndDate.slice(0, 10)}T00:00:00.000Z`)
          : new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000)
        : null;
      if (
        bookingDate &&
        bookingDate < new Date(new Date().toISOString().slice(0, 10))
      )
        throw new BadRequestException('Booking date cannot be in the past');
      if (bookingDate && bookingEndDate && bookingEndDate <= bookingDate)
        throw new BadRequestException(
          'bookingEndDate must be after bookingDate',
        );
      const key = `${item.productId}:${item.variantId ?? ''}:${bookingDate?.toISOString() ?? ''}:${bookingEndDate?.toISOString() ?? ''}`;
      if (keys.has(key))
        throw new BadRequestException('Checkout contains duplicate items');
      keys.add(key);
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        qty: item.qty,
        customNote: item.customNote,
        bookingDate,
        bookingEndDate,
      };
    });
  }

  private async itemsFromCart(userId: string): Promise<CheckoutItemDto[]> {
    const cart = await this.prisma.cartItem.findMany({ where: { userId } });
    return cart.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      qty: item.qty,
      customNote: item.customNote ?? undefined,
      bookingDate: item.bookingDate?.toISOString().slice(0, 10),
      bookingEndDate: item.bookingEndDate?.toISOString().slice(0, 10),
    }));
  }
}
