import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogSchema } from './infrastructure/persistence/activity-log.model';
import { SecuritySignalSchema } from './infrastructure/persistence/security-signal.model';
import { ActivityLogRepositoryImpl } from './infrastructure/persistence/activity-log.repository.impl';
import { SecuritySignalRepositoryImpl } from './infrastructure/persistence/security-signal.repository.impl';
import { ActivityLoggerMiddleware } from './infrastructure/middleware/activity-logger.middleware';
import { GetActivityLogsUseCase } from './application/use-cases/get-activity-logs.usecase';
import { GetActivitySummaryUseCase } from './application/use-cases/get-activity-summary.usecase';
import { GetSecuritySignalsUseCase } from './application/use-cases/get-security-signals.usecase';
import { AcknowledgeSecuritySignalUseCase } from './application/use-cases/acknowledge-security-signal.usecase';
import { SecuritySignalDetectorService } from './application/services/security-signal-detector.service';
import { ActivityController } from './presentation/controllers/activity.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ActivityLog', schema: ActivityLogSchema },
      { name: 'SecuritySignal', schema: SecuritySignalSchema },
    ]),
  ],
  controllers: [ActivityController],
  providers: [
    // Use cases
    GetActivityLogsUseCase,
    GetActivitySummaryUseCase,
    GetSecuritySignalsUseCase,
    AcknowledgeSecuritySignalUseCase,
    
    // Services
    SecuritySignalDetectorService,
    
    // Repositories
    {
      provide: 'IActivityLogRepository',
      useClass: ActivityLogRepositoryImpl,
    },
    {
      provide: 'ISecuritySignalRepository',
      useClass: SecuritySignalRepositoryImpl,
    },
  ],
  exports: [
    'IActivityLogRepository',
    'ISecuritySignalRepository',
  ],
})
export class ActivityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
