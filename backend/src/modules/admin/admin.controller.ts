import {
  Body,
  Controller,
  Delete,
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
import { AdminService } from './admin.service';
import {
  CreateStaffDto,
  StaffQueryDto,
  UpdateAdminProfileDto,
  UpdateStaffDto,
} from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
  @Get('profile')
  profile(@CurrentUser() user: JwtUser) {
    return this.admin.profile(user.id);
  }

  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
  @Put('profile')
  updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.admin.updateProfile(user.id, dto);
  }

  @Roles(UserRole.OWNER)
  @Get('staff')
  staff(@Query() query: StaffQueryDto) {
    return this.admin.listStaff(query);
  }

  @Roles(UserRole.OWNER)
  @Post('staff')
  create(@Body() dto: CreateStaffDto) {
    return this.admin.createStaff(dto);
  }

  @Roles(UserRole.OWNER)
  @Put('staff/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.admin.updateStaff(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Delete('staff/:id')
  delete(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteStaff(user.id, id);
  }
}
