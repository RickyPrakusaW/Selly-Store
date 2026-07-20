import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { StubListDto, stubList } from '../../common/dto/api-contract.dto';
import { AdminOrderActionStubDto, ReassignRentalUnitDto } from './dto/admin-orders.dto';

@ApiTags('admin-orders')
@Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
@Controller('admin/orders')
export class AdminOrdersController {
  @Get()
  @ApiOperation({ summary: 'List admin verification queue scaffold' })
  @ApiOkResponse({ type: StubListDto })
  list(): StubListDto { return stubList(); }

  @Post(':id/verify-dp')
  @ApiOperation({ summary: 'Verify DP scaffold' })
  @ApiOkResponse({ type: AdminOrderActionStubDto })
  verifyDp(@Param('id', ParseUUIDPipe) id: string): AdminOrderActionStubDto {
    return { orderId: id, status: 'dp_verification_scaffold' };
  }

  @Post(':id/verify-final')
  @ApiOperation({ summary: 'Verify final payment scaffold' })
  @ApiOkResponse({ type: AdminOrderActionStubDto })
  verifyFinal(@Param('id', ParseUUIDPipe) id: string): AdminOrderActionStubDto {
    return { orderId: id, status: 'final_verification_scaffold' };
  }

  @Put(':id/reassign-board')
  @ApiOperation({ summary: 'Reassign physical rental unit scaffold' })
  @ApiOkResponse({ type: AdminOrderActionStubDto })
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ReassignRentalUnitDto,
  ): AdminOrderActionStubDto {
    return { orderId: id, status: 'rental_reassignment_scaffold' };
  }
}
