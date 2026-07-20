import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminOrdersController],
  providers: [AdminService],
})
export class AdminModule {}
