import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DokuService } from './doku.service';

const configValues: Record<string, string> = {
  DOKU_CLIENT_ID: 'MCH-test',
  DOKU_SECRET_KEY: 'sandbox-secret',
  DOKU_IS_PRODUCTION: 'false',
  DOKU_NOTIFICATION_URL: 'https://example.com/api/payments/doku/notify',
};

function createService() {
  const config = {
    get: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;
  return new DokuService(config);
}

describe('DokuService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('verifies an authentic webhook signature and rejects a mismatch', () => {
    const service = createService();
    const rawBody = JSON.stringify({ transaction: { status: 'SUCCESS' } });
    const params = {
      clientId: configValues.DOKU_CLIENT_ID!,
      requestId: 'request-1',
      timestamp: '2026-11-19T01:00:00Z',
      targetPath: '/api/payments/doku/notify',
      digest: service.generateDigest(rawBody),
    };
    const signature = service.generateSignature(params);

    expect(
      service.verifyWebhookSignature({
        ...params,
        signatureHeader: signature,
        rawBody,
      }),
    ).toBe(true);
    expect(
      service.verifyWebhookSignature({
        ...params,
        signatureHeader: 'HMACSHA256=invalid',
        rawBody,
      }),
    ).toBe(false);
  });

  it('returns only the real DOKU checkout URL', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          response: {
            payment: {
              url: 'https://sandbox.doku.com/checkout-link-v2/token',
              expired_date: '20261119130000',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const service = createService();

    await expect(
      service.createCheckoutPayment({
        orderId: '95c43be0-9911-4f51-9304-2b3930ac17ec',
        invoiceNumber: 'INV95c43be099114f5193042b3930ac17ecDP1763514000000',
        amount: 10000,
        paymentType: 'DP',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '628123456789',
        callbackUrl: 'http://localhost:3001/pesanan/test',
      }),
    ).resolves.toMatchObject({
      paymentUrl: 'https://sandbox.doku.com/checkout-link-v2/token',
      environment: 'sandbox',
    });
  });

  it('throws when DOKU rejects the request instead of creating fake QR data', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: ['INVALID SIGNATURE'] }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const service = createService();

    await expect(
      service.createCheckoutPayment({
        orderId: '95c43be0-9911-4f51-9304-2b3930ac17ec',
        invoiceNumber: 'INV95c43be099114f5193042b3930ac17ecDP1763514000000',
        amount: 10000,
        paymentType: 'DP',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '628123456789',
        callbackUrl: 'http://localhost:3001/pesanan/test',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('checks a paid transaction with the signed DOKU status API', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          order: { invoice_number: 'DOKU-INVOICE', amount: 275000 },
          transaction: {
            status: 'SUCCESS',
            original_request_id: 'doku-request-id',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const service = createService();

    await expect(service.getPaymentStatus('DOKU-INVOICE')).resolves.toEqual({
      invoiceNumber: 'DOKU-INVOICE',
      amount: 275000,
      status: 'SUCCESS',
      originalRequestId: 'doku-request-id',
    });
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Signature).toMatch(/^HMACSHA256=/);
  });
});
