import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityController } from './presentation/controllers/activity.controller';
import { UserActivityController } from './presentation/controllers/user-activity.controller';
import { GetActivityLogsUseCase } from './application/use-cases/get-activity-logs.usecase';
import { GetActivitySummaryUseCase } from './application/use-cases/get-activity-summary.usecase';
// import { GetSecuritySignalsUseCase } from './application/use-cases/get-security-signals.usecase';
// import { AcknowledgeSecuritySignalUseCase } from './application/use-cases/acknowledge-security-signal.usecase';
import { ActivityLogRepositoryImpl } from './infrastructure/persistence/activity-log.repository.impl';
import { ActivityLogSchema } from './infrastructure/persistence/activity-log.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ActivityLog', schema: ActivityLogSchema }
    ])
  ],
  controllers: [ActivityController, UserActivityController],
  providers: [
    // Use cases
    GetActivityLogsUseCase,
    GetActivitySummaryUseCase,
    // GetSecuritySignalsUseCase,
    // AcknowledgeSecuritySignalUseCase,
    
    // Repositories
    {
      provide: 'IActivityLogRepository',
      useClass: ActivityLogRepositoryImpl,
    },
  ],
  exports: [
    'IActivityLogRepository',
  ],
})
export class ActivityModule {}
