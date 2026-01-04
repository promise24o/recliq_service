import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { NotificationController } from './presentation/controllers/notification.controller';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.usecase';
import { MarkAsReadUseCase } from './application/use-cases/mark-notification-read.usecase';
import { MarkAllAsReadUseCase } from './application/use-cases/mark-all-notifications-read.usecase';
import { SeedNotificationsUseCase } from './application/use-cases/seed-notifications.usecase';
import { NotificationRepositoryImpl } from './infrastructure/persistence/notification.repository.impl';
import { NotificationSchema } from './infrastructure/persistence/notification.model';
import { Env } from '../../core/config/env';
import { SharedEmailModule } from '../../shared/email/shared-email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema }
    ]),
    SharedEmailModule,
  ],
  controllers: [NotificationController],
  providers: [
    GetNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    SeedNotificationsUseCase,
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepositoryImpl,
    },
    {
      provide: Env,
      useFactory: (configService: ConfigService) => new Env(configService),
      inject: [ConfigService],
    },
  ],
  exports: [
    'INotificationRepository',
    GetNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    SeedNotificationsUseCase,
  ],
})
export class NotificationsModule {}
