import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { EmailQueueService } from './queue/email-queue.service';
import { EmailProcessor } from './queue/email.processor';
import { EnhancedBrevoEmailService } from './infrastructure/email/enhanced-brevo.email.service';
import { Env } from '../../core/config/env';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [
    EmailQueueService,
    EmailProcessor,
    EnhancedBrevoEmailService,
    {
      provide: Env,
      useFactory: (configService: ConfigService) => new Env(configService),
      inject: [ConfigService],
    },
  ],
  exports: [
    EmailQueueService,
    EnhancedBrevoEmailService,
  ],
})
export class SharedEmailModule {}
