import { normalizeWhatsAppNumber } from './phone-number.util';

describe('normalizeWhatsAppNumber', () => {
  it.each([
    ['0812 3456 7890', '6281234567890'],
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['+1 (415) 555-2671', '14155552671'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeWhatsAppNumber(input)).toBe(expected);
  });

  it('leaves unsupported value types for validation to reject', () => {
    expect(normalizeWhatsAppNumber(undefined)).toBeUndefined();
    expect(normalizeWhatsAppNumber({ phone: '0812' })).toEqual({
      phone: '0812',
    });
  });
});
