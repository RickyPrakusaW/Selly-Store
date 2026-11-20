export type DokuPaymentType = 'DP' | 'FINAL';

const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function createDokuInvoiceNumber(
  orderId: string,
  paymentType: DokuPaymentType,
  now = Date.now(),
): string {
  let value = BigInt(`0x${orderId.replace(/-/g, '')}`);
  let encoded = '';
  do {
    encoded = BASE62_ALPHABET[Number(value % 62n)] + encoded;
    value /= 62n;
  } while (value > 0n);
  const encodedOrderId = encoded.padStart(22, '0');
  const paymentCode = paymentType === 'DP' ? 'D' : 'F';
  const attemptCode = now.toString(36).slice(-6).padStart(6, '0');
  return `D${encodedOrderId}${paymentCode}${attemptCode}`;
}

export function parseDokuInvoiceNumber(invoiceNumber: string): {
  orderId: string;
  paymentType: DokuPaymentType;
} | null {
  const match = /^D([0-9A-Za-z]{22})(D|F)[0-9a-z]{6}$/.exec(invoiceNumber);
  if (!match?.[1] || !match[2]) return null;

  let value = 0n;
  for (const character of match[1]) {
    const digit = BASE62_ALPHABET.indexOf(character);
    if (digit < 0) return null;
    value = value * 62n + BigInt(digit);
  }
  const compactId = value.toString(16).padStart(32, '0');
  if (compactId.length !== 32) return null;
  return {
    orderId: `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20)}`,
    paymentType: match[2] === 'F' ? 'FINAL' : 'DP',
  };
}
