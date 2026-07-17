import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { BlacklistService } from './blacklist.service';
import { BlacklistQueryDto, CreateBlacklistDto } from './dto/blacklist.dto';

@Roles(UserRole.OWNER)
@Controller('admin/blacklist')
export class BlacklistController {
  constructor(private readonly blacklist: BlacklistService) {}
  @Get() list(@Query() query: BlacklistQueryDto) {
    return this.blacklist.list(query);
  }
  @Post() create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateBlacklistDto,
  ) {
    return this.blacklist.create(user.id, dto);
  }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blacklist.remove(id);
  }
}
