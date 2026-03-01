import { Module, Global, forwardRef } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { FcmModule } from '../fcm/fcm.module';
import { AuthModule } from '../../modules/auth/auth.module';

@Global()
@Module({
  imports: [FcmModule, forwardRef(() => AuthModule)],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
