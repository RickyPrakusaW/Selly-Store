import { Module } from '@nestjs/common';
import { AdminBoardsController, BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  controllers: [BookingController, AdminBoardsController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
