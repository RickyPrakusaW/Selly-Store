import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { OrdersService } from './orders.service';
import {
  AdminReasonDto,
  CancelOrderDto,
  ForceCancelDto,
  OrderListQueryDto,
  ReassignBoardDto,
  RefundDoneDto,
} from './dto/orders.dto';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders/my')
  mine(@CurrentUser() user: JwtUser, @Query() query: OrderListQueryDto) {
    return this.orders.listMine(user.id, query);
  }

  @Get('orders/my/:id')
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
  cancel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancelByCustomer(user.id, id, dto.reason);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
  @Get('admin/orders')
  adminList(@Query() query: OrderListQueryDto) {
    return this.orders.listAdmin(query);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
  @Get('admin/orders/:id')
  adminDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getAdmin(id);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF_VERIFICATION)
  @Post('admin/orders/:id/verify-dp')
  verifyDp(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.verifyDp(id, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF_VERIFICATION)
  @Post('admin/orders/:id/verify-final')
  verifyFinal(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.verifyFinal(id, user.id);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF_VERIFICATION)
  @Post('admin/orders/:id/reject')
  reject(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return this.orders.reject(id, user.id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.STAFF_VERIFICATION)
  @Post('admin/orders/:id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.complete(id);
  }

  @Roles(UserRole.OWNER)
  @Post('admin/orders/:id/force-cancel')
  forceCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ForceCancelDto,
  ) {
    return this.orders.forceCancel(id, dto);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE)
  @Put('admin/orders/:id/refund-done')
  refundDone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundDoneDto,
  ) {
    return this.orders.refundDone(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Put('admin/orders/:id/bookings/:bookingId/reassign')
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: ReassignBoardDto,
  ) {
    return this.orders.reassignBoard(id, bookingId, dto);
  }
}
