import {
  createDokuInvoiceNumber,
  parseDokuInvoiceNumber,
} from './doku-invoice.util';

describe('DOKU invoice encoding', () => {
  const orderId = '95c43be0-9911-4f51-9304-2b3930ac17ec';

  it.each(['DP', 'FINAL'] as const)(
    'round-trips an order UUID for %s payments',
    (paymentType) => {
      const invoice = createDokuInvoiceNumber(
        orderId,
        paymentType,
        1_795_067_200_000,
      );

      expect(invoice).toHaveLength(30);
      expect(invoice).toMatch(/^[A-Za-z0-9]+$/);
      expect(parseDokuInvoiceNumber(invoice)).toEqual({ orderId, paymentType });
    },
  );

  it('rejects an invoice outside the application format', () => {
    expect(parseDokuInvoiceNumber('INV-fake')).toBeNull();
  });
});
