import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { StubEntityDto, StubListDto, stubEntity, stubList } from '../../common/dto/api-contract.dto';
import { OrdersService } from './orders.service';
import { CancelOrderDto, OrderListQueryDto } from './dto/orders.dto';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders/my')
  @ApiOperation({ summary: 'List current customer orders scaffold' })
  @ApiOkResponse({ type: StubListDto })
  mine(
    @CurrentUser() _user: JwtUser,
    @Query() _query: OrderListQueryDto,
  ): StubListDto {
    return stubList();
  }

  @Get('orders/my/:id')
  @ApiOperation({ summary: 'Get customer order detail scaffold' })
  @ApiOkResponse({ type: StubEntityDto })
  detail(
    @CurrentUser() _user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): StubEntityDto {
    return stubEntity(id);
  }

  @Get('orders/:id/remaining-amount')
  remaining(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.remaining(user.id, id);
  }

  @Post('orders/my/:id/cancel')
  @ApiOperation({ summary: 'Cancel customer order scaffold' })
  @ApiCreatedResponse({ type: StubEntityDto })
  cancel(
    @CurrentUser() _user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: CancelOrderDto,
  ): StubEntityDto {
    return stubEntity(id);
  }

}
