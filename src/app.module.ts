import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ZonesModule } from './modules/zones/zones.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ActivityModule } from './modules/activity/activity.module';
import { UsersModule } from './modules/users/users.module';
import { KycModule } from './modules/kyc/kyc.module';
import { RiskModule } from './modules/risk/risk.module';
import { ServiceRadiusModule } from './modules/service-radius/service-radius.module';
import { AgentAvailabilityModule } from './modules/agent-availability/agent-availability.module';
import { VehicleDetailsModule } from './modules/vehicle-details/vehicle-details.module';
import { PickupModule } from './modules/pickup/pickup.module';
import { RedisModule } from './shared/redis/redis.module';
import { FcmModule } from './shared/fcm/fcm.module';
import { LocationCleanupService } from './shared/services/location-cleanup.service';
import { LocationTrackingService } from './shared/services/location-tracking.service';
import { NotificationModule } from './shared/notifications/notification.module';
import { RequestLoggingMiddleware } from './shared/middleware/request-logging.middleware';
import { PlatformDetectionMiddleware } from './shared/middleware/platform-detection.middleware';

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
    ScheduleModule.forRoot(),
    RedisModule,
    FcmModule,
    NotificationModule,
    CoreConfigModule,
    DatabaseModule,
    AuthModule,
    AdminModule,
    ZonesModule,
    NotificationsModule,
    WalletModule,
    RewardsModule,
    ActivityModule,
    UsersModule,
    KycModule,
    RiskModule,
    ServiceRadiusModule,
    AgentAvailabilityModule,
    VehicleDetailsModule,
    PickupModule,
  ],
  providers: [
    LocationTrackingService,
    LocationCleanupService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PlatformDetectionMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
