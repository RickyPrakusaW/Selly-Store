import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentProofController } from './payment-proof.controller';
import { PaymentProofService } from './payment-proof.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentProofController],
  providers: [PaymentProofService],
})
export class PaymentProofModule {}
