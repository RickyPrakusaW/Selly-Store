/**
 * Converts a casually formatted Indonesian mobile number to the canonical
 * WhatsApp form used by the application (country code, digits only).
 *
 * Examples: 0812-3456-7890 -> 6281234567890
 *           +62 812 3456 7890 -> 6281234567890
 */
export function normalizeWhatsAppNumber(value: unknown): unknown {
  if (typeof value !== 'string' && typeof value !== 'number') return value;

  const digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}
