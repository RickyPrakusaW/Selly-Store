import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { DokuService } from './doku.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [DokuService],
  exports: [DokuService],
})
export class PaymentsModule {}
