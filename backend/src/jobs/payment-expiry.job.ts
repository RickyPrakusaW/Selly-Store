import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BookingStatus,
  OrderStatus,
  PaymentStatus,
  ProofType,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { OrdersService } from '../modules/orders/orders.service';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Injectable()
export class PaymentExpiryJob {
  private readonly logger = new Logger(PaymentExpiryJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePayments(): Promise<void> {
    const now = new Date();
    const dueDp = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        dpDeadline: { lte: now },
        downPayment: { status: PaymentStatus.WAITING_PROOF },
      },
      select: { id: true },
    });
    const dueFinal = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_FINAL_PAYMENT,
        finalPaymentDeadline: { lte: now },
        paymentProofs: {
          none: {
            proofType: ProofType.FINAL,
            verificationStatus: VerificationStatus.PENDING,
            retractedAt: null,
          },
        },
      },
      select: { id: true },
    });
    for (const entry of dueDp) await this.cancel(entry.id, false);
    for (const entry of dueFinal) await this.cancel(entry.id, true);
    await this.prisma.boardBooking.updateMany({
      where: {
        status: BookingStatus.SOFT_LOCKED,
        expiresAt: { lte: now },
        OR: [
          { orderId: null },
          {
            order: {
              status: {
                in: [
                  OrderStatus.CANCELLED,
                  OrderStatus.REJECTED,
                  OrderStatus.COMPLETED,
                ],
              },
            },
          },
        ],
      },
      data: { status: BookingStatus.CANCELLED, expiresAt: null },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async warnFinalPayments(): Promise<void> {
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_FINAL_PAYMENT,
        finalWarningSentAt: null,
        finalPaymentDeadline: { gt: now, lte: nextDay },
      },
      include: { user: true },
    });
    for (const order of orders) {
      try {
        await this.mail.send(
          order.user.email,
          'Seli Florist final payment reminder',
          `Final payment for order ${order.id} is due by ${order.finalPaymentDeadline?.toISOString()}.`,
        );
        await this.prisma.order.update({
          where: { id: order.id },
          data: { finalWarningSentAt: new Date() },
        });
      } catch (error) {
        this.logger.error(
          `Could not send final-payment warning for ${order.id}`,
          error,
        );
      }
    }
  }

  private async cancel(orderId: string, finalPayment: boolean): Promise<void> {
    try {
      const order = await this.orders.cancelExpired(orderId, finalPayment);
      if (!order) return;
      this.notifications.admin('order_auto_cancelled', {
        orderId,
        stage: finalPayment ? 'final' : 'dp',
        refundAmount: order.refundAmount?.toString() ?? null,
      });
      await this.mail.send(
        order.user.email,
        'Seli Florist payment deadline expired',
        `Order ${orderId} was cancelled because its payment deadline expired.`,
      );
    } catch (error) {
      this.logger.error(`Could not expire order ${orderId}`, error);
    }
  }
}
