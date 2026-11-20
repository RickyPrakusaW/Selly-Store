import { isValidPhoneNumber } from "libphonenumber-js";

/** Convert 08xx / +62xx input to the digits-only 628xx WhatsApp format. */
export function normalizeWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsAppNumber(value: string): boolean {
  const normalized = normalizeWhatsAppNumber(value);
  if (!/^[1-9]\d{7,14}$/.test(normalized)) return false;

  try {
    return isValidPhoneNumber(`+${normalized}`);
  } catch {
    return false;
  }
}

