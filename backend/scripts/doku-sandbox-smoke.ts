import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { DokuService } from '../src/modules/payments/doku.service';

async function main() {
  if (process.env.DOKU_IS_PRODUCTION?.toLowerCase() === 'true') {
    throw new Error('Smoke test hanya boleh dijalankan pada DOKU sandbox');
  }

  const service = new DokuService(new ConfigService(process.env));
  const orderId = randomUUID();
  const invoiceNumber = `TEST${Date.now()}`;
  const frontendUrl = (
    process.env.FRONTEND_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');
  const result = await service.createCheckoutPayment({
    orderId,
    invoiceNumber,
    amount: 10_000,
    paymentType: 'DP',
    customerName: 'DOKU Sandbox Test',
    customerEmail: 'sandbox-test@example.com',
    customerPhone: '628123456789',
    callbackUrl: `${frontendUrl}/pesanan/${orderId}`,
  });

  const url = new URL(result.paymentUrl);
  console.log(
    JSON.stringify({
      ok: true,
      environment: result.environment,
      paymentHost: url.host,
      invoiceNumber: result.invoiceNumber,
      expiresAt: result.expiresAt,
    }),
  );
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'DOKU sandbox smoke test gagal',
  );
  process.exitCode = 1;
});
