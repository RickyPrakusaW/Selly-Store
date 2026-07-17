import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RefundPolicyService } from './refund-policy.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, RefundPolicyService],
  exports: [OrdersService, RefundPolicyService],
})
export class OrdersModule {}
