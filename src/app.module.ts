import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { CoreConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { RequestLoggingMiddleware } from './shared/middleware/request-logging.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0'),
        },
      }),
    }),
    CoreConfigModule,
    DatabaseModule,
    AuthModule,
    NotificationsModule,
    WalletModule,
    RewardsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
