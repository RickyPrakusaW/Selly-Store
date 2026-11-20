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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BookingService } from './booking.service';
import {
  AvailabilityQueryDto,
  CalendarQueryDto,
  CreateBoardDto,
  UpdateBoardDto,
} from './booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Public() @Get('calendar') calendar(@Query() query: CalendarQueryDto) {
    return this.booking.calendar(query.month);
  }
  @Get('check-availability') availability(
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.booking.availability(query.date);
  }
}

@Controller('admin/boards')
export class AdminBoardsController {
  constructor(private readonly booking: BookingService) {}

  @Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
  @Get()
  boards() {
    return this.booking.listBoards();
  }

  @Roles(UserRole.OWNER)
  @Post()
  create(@Body() dto: CreateBoardDto) {
    return this.booking.createBoard(dto);
  }

  @Roles(UserRole.OWNER)
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBoardDto) {
    return this.booking.updateBoard(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.booking.deleteBoard(id);
  }
}
