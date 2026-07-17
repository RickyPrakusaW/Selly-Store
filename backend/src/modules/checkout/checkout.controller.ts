import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifiedOnly } from '../../common/decorators/verified-only.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { CheckoutService } from './checkout.service';
import { CheckoutDto, EstimateShippingDto } from './dto/checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('estimate-ongkir')
  estimate(@Body() dto: EstimateShippingDto) {
    return this.checkoutService.estimate(dto);
  }

  @VerifiedOnly()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  checkout(@CurrentUser() user: JwtUser, @Body() dto: CheckoutDto) {
    return this.checkoutService.checkout(user.id, dto);
  }
}
