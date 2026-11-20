import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEnum, IsUUID } from 'class-validator';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { DokuService } from './doku.service';
import {
  createDokuInvoiceNumber,
  parseDokuInvoiceNumber,
} from './doku-invoice.util';

enum PaymentType {
  DP = 'DP',
  FINAL = 'FINAL',
}

class CreateDokuCheckoutDto {
  @IsUUID()
  orderId!: string;

  @IsEnum(PaymentType)
  paymentType!: PaymentType;
}

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly dokuService: DokuService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('doku/checkout')
  async createDokuCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDokuCheckoutDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { user: true, downPayment: true },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.userId !== req.user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }

    const isDp = dto.paymentType === PaymentType.DP;
    if (
      (isDp && !['PENDING_PAYMENT', 'REJECTED'].includes(order.status)) ||
      (!isDp && order.status !== 'PENDING_FINAL_PAYMENT')
    ) {
      throw new BadRequestException(
        isDp
          ? 'Pesanan ini sudah tidak membutuhkan pembayaran DP'
          : 'Pesanan ini belum dalam tahap pelunasan final',
      );
    }

    const amount = Number(isDp ? order.dpAmount : order.remainingAmount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('Nominal pembayaran tidak valid');
    }

    const invoiceNumber = createDokuInvoiceNumber(order.id, dto.paymentType);
    const frontendUrl = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
    const checkout = await this.dokuService.createCheckoutPayment({
      orderId: order.id,
      invoiceNumber,
      amount,
      paymentType: dto.paymentType,
      customerName: order.customerName,
      customerEmail: order.user.email,
      customerPhone: order.waNumber,
      callbackUrl: `${frontendUrl}/pesanan/${order.id}`,
    });

    return {
      orderId: order.id,
      orderNumber: `#ORDER-${order.id.slice(0, 8).toUpperCase()}`,
      ...checkout,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('doku/status/:orderId')
  async getPaymentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Query('invoiceNumber') invoiceNumber?: string,
  ): Promise<Record<string, unknown>> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { downPayment: true },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.userId !== req.user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }

    if (
      invoiceNumber &&
      ['PENDING_PAYMENT', 'REJECTED', 'PENDING_FINAL_PAYMENT'].includes(
        order.status,
      )
    ) {
      const parsed = parseDokuInvoiceNumber(invoiceNumber);
      if (!parsed || parsed.orderId !== order.id) {
        throw new BadRequestException('Invoice DOKU tidak sesuai pesanan');
      }

      const dokuStatus = await this.dokuService.getPaymentStatus(invoiceNumber);
      const expectedAmount = Number(
        parsed.paymentType === PaymentType.DP
          ? order.dpAmount
          : order.remainingAmount,
      );
      if (
        dokuStatus.status === 'SUCCESS' &&
        dokuStatus.invoiceNumber === invoiceNumber &&
        Number.isSafeInteger(dokuStatus.amount) &&
        dokuStatus.amount === expectedAmount
      ) {
        if (parsed.paymentType === PaymentType.DP) {
          await this.ordersService.markDpPaidByGateway(
            order.id,
            dokuStatus.originalRequestId,
            'DOKU',
          );
        } else {
          await this.ordersService.markFinalPaidByGateway(
            order.id,
            dokuStatus.originalRequestId,
            'DOKU',
          );
        }
        return this.getPaymentStatus(req, orderId);
      }
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      dpStatus: order.downPayment?.status,
      isDpPaid:
        order.downPayment?.status === 'VERIFIED' ||
        !['PENDING_PAYMENT', 'REJECTED'].includes(order.status),
      isFullyPaid: ['FULLY_PAID', 'PROCESSING', 'COMPLETED'].includes(
        order.status,
      ),
      remainingAmount: Number(order.remainingAmount),
    };
  }

  @Public()
  @Get('doku/notify')
  @HttpCode(HttpStatus.OK)
  dokuPing() {
    return { status: 'SUCCESS' };
  }

  @Public()
  @Post('doku/notify')
  @HttpCode(HttpStatus.OK)
  async dokuNotification(
    @Req() req: RawBodyRequest<Request>,
    @Headers('client-id') clientId = '',
    @Headers('request-id') requestId = '',
    @Headers('request-timestamp') timestamp = '',
    @Headers('signature') signature = '',
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody?.toString('utf8') || '';
    const targetPath = req.originalUrl.split('?')[0] || req.path;
    if (
      !this.dokuService.verifyWebhookSignature({
        clientId,
        requestId,
        timestamp,
        targetPath,
        signatureHeader: signature,
        rawBody,
      })
    ) {
      throw new BadRequestException('Signature DOKU tidak valid');
    }

    const transaction = (body.transaction || {}) as Record<string, unknown>;
    if (transaction.status !== 'SUCCESS') {
      return { status: 'SUCCESS' };
    }

    const orderPayload = (body.order || {}) as Record<string, unknown>;
    const invoiceNumber = String(orderPayload.invoice_number || '');
    const parsed = parseDokuInvoiceNumber(invoiceNumber);
    if (!parsed) throw new BadRequestException('Invoice DOKU tidak valid');

    const order = await this.prisma.order.findUnique({
      where: { id: parsed.orderId },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    const receivedAmount = Number(orderPayload.amount);
    const expectedAmount = Number(
      parsed.paymentType === PaymentType.DP
        ? order.dpAmount
        : order.remainingAmount,
    );
    if (
      !Number.isSafeInteger(receivedAmount) ||
      receivedAmount !== expectedAmount
    ) {
      throw new BadRequestException('Nominal notifikasi DOKU tidak sesuai');
    }

    const referenceId = String(transaction.original_request_id || requestId);
    if (parsed.paymentType === PaymentType.DP) {
      await this.ordersService.markDpPaidByGateway(
        order.id,
        referenceId,
        'DOKU',
      );
    } else {
      await this.ordersService.markFinalPaidByGateway(
        order.id,
        referenceId,
        'DOKU',
      );
    }

    return { status: 'SUCCESS' };
  }
}
