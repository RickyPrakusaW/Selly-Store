import { Module } from '@nestjs/common';
import { OrdersModule } from '../modules/orders/orders.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { PaymentExpiryJob } from './payment-expiry.job';

@Module({
  imports: [OrdersModule, NotificationsModule],
  providers: [PaymentExpiryJob],
})
export class JobsModule {}
