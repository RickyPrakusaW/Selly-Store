import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { OrdersService } from './orders.service';
import { CancelOrderDto, OrderListQueryDto } from './dto/orders.dto';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders/my')
  @ApiOperation({ summary: 'List current customer orders' })
  mine(@CurrentUser() user: JwtUser, @Query() query: OrderListQueryDto) {
    return this.orders.listMine(user.id, query);
  }

  @Get('orders/my/:id')
  @ApiOperation({ summary: 'Get customer order detail' })
  detail(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getMine(user.id, id);
  }

  @Get('orders/:id/remaining-amount')
  remaining(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.remaining(user.id, id);
  }

  @Post('orders/my/:id/cancel')
  @ApiOperation({ summary: 'Cancel customer order' })
  cancel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancelByCustomer(user.id, id, dto.reason);
  }
}
