import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifiedOnly } from '../../common/decorators/verified-only.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { StubEntityDto, stubEntity } from '../../common/dto/api-contract.dto';
import { CheckoutService } from './checkout.service';
import { CheckoutDto, EstimateShippingDto } from './dto/checkout.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('estimate-ongkir')
  @ApiOperation({ summary: 'Estimate delivery fee scaffold' })
  @ApiOkResponse({ type: StubEntityDto })
  estimate(@Body() _dto: EstimateShippingDto): StubEntityDto {
    return stubEntity();
  }

  @VerifiedOnly()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Create checkout scaffold' })
  @ApiCreatedResponse({ type: StubEntityDto })
  checkout(
    @CurrentUser() _user: JwtUser,
    @Body() _dto: CheckoutDto,
  ): StubEntityDto {
    return stubEntity();
  }
}
