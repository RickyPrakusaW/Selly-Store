import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { DokuService } from './doku.service';

interface GenerateQrisDto {
  orderId: string;
  paymentType?: 'DP' | 'FINAL';
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly dokuService: DokuService,
  ) {}

  /**
   * Generate QRIS DOKU untuk pembayaran DP atau Pelunasan
   */
  @UseGuards(JwtAuthGuard)
  @Post('qris/generate')
  async generateQris(@Req() req: Request & { user: { id: string } }, @Body() dto: GenerateQrisDto) {
    if (!dto.orderId) {
      throw new BadRequestException('ID Pesanan wajib diisi');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { user: true, downPayment: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    // Pastikan pesanan milik user yang sedang login
    if (order.userId !== req.user.id) {
      throw new BadRequestException('Anda tidak memiliki akses ke pesanan ini');
    }

    const paymentType = dto.paymentType || (order.status === 'PENDING_FINAL_PAYMENT' ? 'FINAL' : 'DP');

    let amount = 0;
    if (paymentType === 'DP') {
      if (order.status !== 'PENDING_PAYMENT' && order.status !== 'REJECTED') {
        throw new BadRequestException('Pesanan ini sudah tidak membutuhkan pembayaran DP');
      }
      amount = Number(order.dpAmount);
    } else {
      if (order.status !== 'PENDING_FINAL_PAYMENT') {
        throw new BadRequestException('Pesanan ini belum dalam tahap pelunasan final');
      }
      amount = Number(order.remainingAmount);
    }

    if (amount <= 0) {
      throw new BadRequestException('Nominal pembayaran tidak valid');
    }

    const shortId = order.id.slice(0, 8).toUpperCase();
    const invoiceNumber = `INV_${order.id}_${paymentType}_${Date.now()}`;

    const qrisData = await this.dokuService.createQrisPayment({
      orderId: order.id,
      invoiceNumber,
      amount,
      paymentType,
      customerName: order.customerName,
      customerEmail: order.user?.email || '',
      customerPhone: order.waNumber,
    });

    return {
      status: 'success',
      data: {
        orderId: order.id,
        orderNumber: `#ORDER-${shortId}`,
        ...qrisData,
      },
    };
  }

  /**
   * Cek status pembayaran terkini untuk pesanan
   */
  @UseGuards(JwtAuthGuard)
  @Get('qris/status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { downPayment: true },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const isDpPaid =
      order.downPayment?.status === 'VERIFIED' ||
      order.status !== 'PENDING_PAYMENT' && order.status !== 'REJECTED';

    const isFullyPaid =
      order.status === 'FULLY_PAID' ||
      order.status === 'PROCESSING' ||
      order.status === 'COMPLETED';

    return {
      status: 'success',
      data: {
        orderId: order.id,
        orderStatus: order.status,
        dpStatus: order.downPayment?.status,
        isDpPaid,
        isFullyPaid,
        remainingAmount: Number(order.remainingAmount),
      },
    };
  }

  /**
   * Healthcheck / Ping endpoint untuk DOKU dashboard testing
   */
  @Public()
  @Get('doku/notify')
  @HttpCode(HttpStatus.OK)
  dokuPing() {
    return { status: 'SUCCESS', message: 'DOKU Webhook endpoint is active' };
  }

  /**
   * Webhook HTTP Notification dari DOKU saat customer berhasil scan & bayar QRIS
   */
  @Public()
  @Post('doku/notify')
  @HttpCode(HttpStatus.OK)
  async dokuNotification(
    @Headers('client-id') clientId: string,
    @Headers('request-id') requestId: string,
    @Headers('request-timestamp') timestamp: string,
    @Headers('signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    // Tangani ping / verifikasi konektivitas dari DOKU Dashboard (misal saat merchant simpan URL)
    if (!body || Object.keys(body).length === 0) {
      return { status: 'SUCCESS', message: 'DOKU Webhook ping received' };
    }

    // Verifikasi signature dari DOKU
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {});
    const isValid = this.dokuService.verifyWebhookSignature({
      clientId,
      requestId,
      timestamp,
      targetPath: '/api/payments/doku/notify',
      signatureHeader: signature,
      rawBody,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid DOKU Signature');
    }

    const orderObj = (body?.order as Record<string, unknown>) || {};
    const invoiceNumber = String(orderObj.invoice_number || '');
    const trxObj = (body?.transaction as Record<string, unknown>) || {};
    const trxId = String(trxObj.id || trxObj.transaction_id || requestId || 'DOKU-TRX');

    // Parse invoice_number: INV_{orderId}_{paymentType}_{timestamp}
    if (invoiceNumber) {
      const parts = invoiceNumber.split('_');
      const orderId = parts[1];
      const paymentType = parts[2] === 'FINAL' ? 'FINAL' : 'DP';

      if (orderId) {
        const targetOrder = await this.prisma.order.findUnique({
          where: { id: orderId },
        });

        if (targetOrder) {
          if (paymentType === 'DP') {
            await this.ordersService.markDpPaidByGateway(
              targetOrder.id,
              trxId,
              'DOKU',
            );
          } else {
            await this.ordersService.markFinalPaidByGateway(
              targetOrder.id,
              trxId,
              'DOKU',
            );
          }
        }
      }
    }

    return { status: 'SUCCESS' };
  }

  /**
   * Endpoint Helper untuk Simulasi Pembayaran QRIS Berhasil (Development / Sandbox)
   */
  @UseGuards(JwtAuthGuard)
  @Post('qris/simulate-success')
  async simulateSuccessPayment(@Body() dto: GenerateQrisDto) {
    if (!dto.orderId) {
      throw new BadRequestException('ID Pesanan wajib diisi');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const mockTrxId = `SIM-DOKU-${Date.now().toString().slice(-6)}`;
    const paymentType = dto.paymentType || (order.status === 'PENDING_FINAL_PAYMENT' ? 'FINAL' : 'DP');

    if (paymentType === 'DP') {
      await this.ordersService.markDpPaidByGateway(order.id, mockTrxId, 'DOKU (Simulasi)');
    } else {
      await this.ordersService.markFinalPaidByGateway(order.id, mockTrxId, 'DOKU (Simulasi)');
    }

    return {
      status: 'success',
      message: `Simulasi pembayaran ${paymentType} QRIS berhasil. Status pesanan diperbarui otomatis.`,
      transactionId: mockTrxId,
    };
  }
}
