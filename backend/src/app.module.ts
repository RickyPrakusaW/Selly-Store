import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { VerifiedGuard } from './common/guards/verified.guard';
import { MailModule } from './common/mail/mail.module';
import { WaModule } from './common/wa/wa.module';
import { NotificationQueueModule } from './common/notification-queue/notification-queue.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { BookingModule } from './modules/booking/booking.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentProofModule } from './modules/payment-proof/payment-proof.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BlacklistModule } from './modules/blacklist/blacklist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';

function validateConfig(config: Record<string, unknown>) {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ALLOWED_ORIGINS',
  ];
  const missing = required.filter((key) => !config[key]);
  if (missing.length)
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  if (config.NODE_ENV === 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
      const value = String(config[key]);
      if (value.length < 32 || /supersecret|changeme|your_/i.test(value))
        throw new Error(`${key} must be a strong production secret`);
    }
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateConfig,
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),

    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MailModule,
    WaModule,
    NotificationQueueModule,
    StorageModule,
    AuthModule,
    CatalogModule,
    CartModule,
    BookingModule,
    CheckoutModule,
    OrdersModule,
    PaymentProofModule,
    FinanceModule,
    ReportsModule,
    BlacklistModule,
    NotificationsModule,
    AdminModule,
    JobsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: VerifiedGuard },
  ],
})
export class AppModule {}
