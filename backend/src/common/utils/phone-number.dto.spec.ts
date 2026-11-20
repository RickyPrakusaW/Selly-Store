import { DeliveryType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../../modules/auth/dto/auth.dto';
import { CheckoutDto } from '../../modules/checkout/dto/checkout.dto';

describe('WhatsApp DTO normalization', () => {
  it('normalizes a local registration number before validation', async () => {
    const dto = plainToInstance(RegisterDto, {
      fullName: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'PasswordKuat123!',
      phoneNumber: '0812-3456-7890',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.phoneNumber).toBe('6281234567890');
  });

  it('normalizes checkout contact numbers before validation', async () => {
    const dto = plainToInstance(CheckoutDto, {
      deliveryType: DeliveryType.PICKUP,
      customerName: 'Budi Santoso',
      waNumber: '+62 812 3456 7890',
      recipientName: 'Siti Aminah',
      recipientPhone: '0813 4567 8901',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.waNumber).toBe('6281234567890');
    expect(dto.recipientPhone).toBe('6281345678901');
  });

  it('accepts a non-Indonesian E.164 number', async () => {
    const dto = plainToInstance(RegisterDto, {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      password: 'StrongPassword123!',
      phoneNumber: '+1 (415) 555-2671',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.phoneNumber).toBe('14155552671');
  });
});
