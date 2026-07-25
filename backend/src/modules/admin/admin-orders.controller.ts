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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { OrdersService } from '../orders/orders.service';
import {
  AdminReasonDto,
  ForceCancelDto,
  OrderListQueryDto,
  ReassignBoardDto,
  RefundDoneDto,
  UpdateOrderStatusDto,
} from '../orders/dto/orders.dto';

@ApiTags('admin-orders')
@Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List admin order verification queue' })
  list(@Query() query: OrderListQueryDto) {
    return this.ordersService.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail for admin' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getAdmin(id);
  }

  @Post(':id/verify-dp')
  @ApiOperation({ summary: 'Verify DP 50% payment proof' })
  verifyDp(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.verifyDp(id, user.id);
  }

  @Post(':id/verify-final')
  @ApiOperation({ summary: 'Verify final payment proof' })
  verifyFinal(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.verifyFinal(id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject payment proof and blacklist customer' })
  reject(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReasonDto,
  ) {
    return this.ordersService.reject(id, user.id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark order as completed' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.complete(id);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Start processing a fully paid order' })
  process(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.process(id);
  }

  @Post(':id/force-cancel')
  @ApiOperation({ summary: 'Force cancel order by admin' })
  forceCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ForceCancelDto,
  ) {
    return this.ordersService.forceCancel(id, dto);
  }

  @Put(':id/refund-done')
  @ApiOperation({ summary: 'Confirm manual refund transfer done' })
  refundDone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundDoneDto,
  ) {
    return this.ordersService.refundDone(id, dto);
  }

  @Put(':id/reassign-board')
  @ApiOperation({ summary: 'Reassign physical rental board unit' })
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReassignBoardDto,
  ) {
    return this.ordersService.reassignBoard(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Manually change order status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
