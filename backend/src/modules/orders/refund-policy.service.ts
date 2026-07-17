import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class RefundPolicyService {
  constructor(private readonly config: ConfigService) {}

  calculate(
    dpAmount: Prisma.Decimal,
    createdAt: Date,
    cancelledAt = new Date(),
  ) {
    const ageHours = (cancelledAt.getTime() - createdAt.getTime()) / 3_600_000;
    const tier1 = this.config.get<number>('REFUND_TIER1_HOURS', 12);
    const tier2 = this.config.get<number>('REFUND_TIER2_HOURS', 24);
    const deduction =
      ageHours < tier1
        ? this.config.get<number>('REFUND_TIER1_DEDUCTION', 0)
        : ageHours <= tier2
          ? this.config.get<number>('REFUND_TIER2_DEDUCTION', 25)
          : this.config.get<number>('REFUND_TIER3_DEDUCTION', 50);
    return {
      deductionPct: deduction,
      refundAmount: dpAmount
        .mul(new Prisma.Decimal(100 - deduction).div(100))
        .toDecimalPlaces(2),
    };
  }
}
