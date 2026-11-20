import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';

export interface CreateDokuCheckoutParams {
  orderId: string;
  invoiceNumber: string;
  amount: number;
  paymentType: 'DP' | 'FINAL';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callbackUrl: string;
}

export interface DokuCheckoutResponse {
  invoiceNumber: string;
  amount: number;
  paymentUrl: string;
  expiresAt: string;
  environment: 'sandbox' | 'production';
  paymentType: 'DP' | 'FINAL';
}

export interface DokuPaymentStatusResponse {
  invoiceNumber: string;
  amount: number;
  status: string;
  originalRequestId: string;
}

@Injectable()
export class DokuService {
  private readonly logger = new Logger(DokuService.name);
  private readonly clientId: string;
  private readonly secretKey: string;
  private readonly isProduction: boolean;
  private readonly notificationUrl: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('DOKU_CLIENT_ID')?.trim() || '';
    this.secretKey = this.config.get<string>('DOKU_SECRET_KEY')?.trim() || '';
    this.isProduction =
      this.config.get<string>('DOKU_IS_PRODUCTION')?.toLowerCase() === 'true';
    this.notificationUrl =
      this.config.get<string>('DOKU_NOTIFICATION_URL')?.trim() || '';
    this.baseUrl = this.isProduction
      ? 'https://api.doku.com'
      : 'https://api-sandbox.doku.com';
  }

  isConfigured(): boolean {
    return Boolean(
      this.clientId &&
      this.secretKey &&
      /^https:\/\//.test(this.notificationUrl),
    );
  }

  generateDigest(bodyString = ''): string {
    return createHash('sha256').update(bodyString, 'utf8').digest('base64');
  }

  generateSignature(params: {
    clientId: string;
    requestId: string;
    timestamp: string;
    targetPath: string;
    digest: string;
  }): string {
    const component =
      `Client-Id:${params.clientId}\n` +
      `Request-Id:${params.requestId}\n` +
      `Request-Timestamp:${params.timestamp}\n` +
      `Request-Target:${params.targetPath}\n` +
      `Digest:${params.digest}`;
    const hmac = createHmac('sha256', this.secretKey)
      .update(component, 'utf8')
      .digest('base64');
    return `HMACSHA256=${hmac}`;
  }

  generateGetSignature(params: {
    clientId: string;
    requestId: string;
    timestamp: string;
    targetPath: string;
  }): string {
    const component =
      `Client-Id:${params.clientId}\n` +
      `Request-Id:${params.requestId}\n` +
      `Request-Timestamp:${params.timestamp}\n` +
      `Request-Target:${params.targetPath}`;
    const hmac = createHmac('sha256', this.secretKey)
      .update(component, 'utf8')
      .digest('base64');
    return `HMACSHA256=${hmac}`;
  }

  verifyWebhookSignature(params: {
    clientId: string;
    requestId: string;
    timestamp: string;
    targetPath: string;
    signatureHeader: string;
    rawBody: string;
  }): boolean {
    if (!this.isConfigured() || params.clientId !== this.clientId) return false;
    if (
      !params.requestId ||
      !params.timestamp ||
      !params.signatureHeader ||
      !params.rawBody
    ) {
      return false;
    }

    const expected = this.generateSignature({
      clientId: params.clientId,
      requestId: params.requestId,
      timestamp: params.timestamp,
      targetPath: params.targetPath,
      digest: this.generateDigest(params.rawBody),
    });
    const receivedBuffer = Buffer.from(params.signatureHeader.trim());
    const expectedBuffer = Buffer.from(expected);
    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }

  async createCheckoutPayment(
    params: CreateDokuCheckoutParams,
  ): Promise<DokuCheckoutResponse> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Konfigurasi DOKU belum lengkap atau Notification URL belum HTTPS',
      );
    }

    const requestId = randomUUID();
    const timestamp = `${new Date().toISOString().slice(0, 19)}Z`;
    const targetPath = '/checkout/v1/payment';
    const customerName =
      params.customerName
        .replace(/[^A-Za-z ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 255) || 'Customer';
    const payload = {
      order: {
        amount: Math.round(params.amount),
        invoice_number: params.invoiceNumber,
        currency: 'IDR',
        callback_url: params.callbackUrl,
        auto_redirect: true,
      },
      payment: { payment_due_date: 60 },
      customer: {
        id: params.orderId.slice(0, 50),
        name: customerName,
        email: params.customerEmail.slice(0, 128),
        phone: params.customerPhone.slice(0, 16),
      },
      additional_info: {
        override_notification_url: this.notificationUrl,
      },
    };
    const body = JSON.stringify(payload);
    const signature = this.generateSignature({
      clientId: this.clientId,
      requestId,
      timestamp,
      targetPath,
      digest: this.generateDigest(body),
    });

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${targetPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': this.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
        },
        body,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      this.logger.error(
        `DOKU checkout request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadGatewayException('Tidak dapat terhubung ke DOKU');
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      const dokuMessage = this.extractDokuMessage(data);
      this.logger.error(
        `DOKU checkout rejected with HTTP ${response.status}: ${dokuMessage}`,
      );
      throw new BadGatewayException({
        message: 'DOKU menolak pembuatan transaksi',
        dokuStatus: response.status,
        dokuMessage,
      });
    }

    const responseData = data.response as Record<string, unknown> | undefined;
    const payment = responseData?.payment as
      Record<string, unknown> | undefined;
    const paymentUrl =
      typeof payment?.url === 'string' ? payment.url.trim() : '';
    const expiredDate =
      typeof payment?.expired_date === 'string'
        ? payment.expired_date.trim()
        : '';
    if (!/^https:\/\//.test(paymentUrl) || !expiredDate) {
      this.logger.error('DOKU response did not contain a valid payment URL');
      throw new BadGatewayException('Respons pembayaran DOKU tidak lengkap');
    }

    return {
      invoiceNumber: params.invoiceNumber,
      amount: Math.round(params.amount),
      paymentUrl,
      expiresAt: expiredDate,
      environment: this.isProduction ? 'production' : 'sandbox',
      paymentType: params.paymentType,
    };
  }

  async getPaymentStatus(
    invoiceNumber: string,
  ): Promise<DokuPaymentStatusResponse> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Konfigurasi DOKU belum lengkap');
    }

    const requestId = randomUUID();
    const timestamp = `${new Date().toISOString().slice(0, 19)}Z`;
    const targetPath = `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`;
    const signature = this.generateGetSignature({
      clientId: this.clientId,
      requestId,
      timestamp,
      targetPath,
    });

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${targetPath}`, {
        method: 'GET',
        headers: {
          'Client-Id': this.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      this.logger.error(
        `DOKU status request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadGatewayException('Tidak dapat memeriksa status DOKU');
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      throw new BadGatewayException({
        message: 'DOKU menolak pemeriksaan status transaksi',
        dokuStatus: response.status,
        dokuMessage: this.extractDokuMessage(data),
      });
    }

    const order = (data.order || {}) as Record<string, unknown>;
    const transaction = (data.transaction || {}) as Record<string, unknown>;
    return {
      invoiceNumber: String(order.invoice_number || ''),
      amount: Number(order.amount),
      status: String(transaction.status || ''),
      originalRequestId: String(transaction.original_request_id || requestId),
    };
  }

  private extractDokuMessage(data: Record<string, unknown>): string {
    const message = data.message;
    if (Array.isArray(message))
      return message.map(String).join(', ').slice(0, 500);
    if (typeof message === 'string') return message.slice(0, 500);
    const error = data.error as Record<string, unknown> | undefined;
    if (typeof error?.message === 'string') return error.message.slice(0, 500);
    return 'No error detail returned';
  }
}
