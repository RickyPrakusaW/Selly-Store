import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { RefundPolicyService } from './refund-policy.service';

describe('RefundPolicyService', () => {
  const service = new RefundPolicyService(
    new ConfigService({
      REFUND_TIER1_HOURS: 12,
      REFUND_TIER1_DEDUCTION: 0,
      REFUND_TIER2_HOURS: 24,
      REFUND_TIER2_DEDUCTION: 25,
      REFUND_TIER3_DEDUCTION: 50,
    }),
  );
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const dp = new Prisma.Decimal(100_000);

  it.each([
    [11, 0, '100000'],
    [12, 25, '75000'],
    [24, 25, '75000'],
    [25, 50, '50000'],
  ])('applies the correct tier at %s hours', (hours, deductionPct, amount) => {
    const result = service.calculate(
      dp,
      createdAt,
      new Date(createdAt.getTime() + hours * 3_600_000),
    );
    expect(result.deductionPct).toBe(deductionPct);
    expect(result.refundAmount.toString()).toBe(amount);
  });
});
