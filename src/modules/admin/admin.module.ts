import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './presentation/controllers/admin.controller';
import { ListAdminsUseCase } from './application/use-cases/list-admins.usecase';
import { CreateAdminUseCase } from './application/use-cases/create-admin.usecase';
import { UpdateAdminUseCase } from './application/use-cases/update-admin.usecase';
import { SuspendAdminUseCase } from './application/use-cases/suspend-admin.usecase';
import { ActivateAdminUseCase } from './application/use-cases/activate-admin.usecase';
import { RevokeAdminUseCase } from './application/use-cases/revoke-admin.usecase';
import { AssignAdminUseCase } from './application/use-cases/assign-admin.usecase';
import { GetRolesSummaryUseCase } from './application/use-cases/get-roles-summary.usecase';
import { GetRoleDefinitionsUseCase } from './application/use-cases/get-role-definitions.usecase';
import { GetPermissionAnalysisUseCase } from './application/use-cases/get-permission-analysis.usecase';
import { GetRoleChangeHistoryUseCase } from './application/use-cases/get-role-change-history.usecase';
import { GetAdminProfileUseCase } from './application/use-cases/get-admin-profile.usecase';
import { GetSecuritySettingsUseCase } from './application/use-cases/get-security-settings.usecase';
import { GetAccountActivityUseCase } from './application/use-cases/get-account-activity.usecase';
import { GetNotificationPreferencesUseCase } from './application/use-cases/get-notification-preferences.usecase';
import { UpdateAdminProfileUseCase } from './application/use-cases/update-admin-profile.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { UpdateNotificationPreferencesUseCase } from './application/use-cases/update-notification-preferences.usecase';
import { AuthRepositoryImpl } from '../auth/infrastructure/persistence/auth.repository.impl';
import { PasswordService } from '../auth/infrastructure/security/password.service';
import { UserSchema } from '../auth/infrastructure/persistence/user.model';
import { ActivitySchema } from '../auth/infrastructure/persistence/activity.model';
import { ActivityLoggingService } from '../auth/domain/services/activity-logging.service';
import { SharedEmailModule } from '../../shared/email/shared-email.module';
import { EmailQueueService } from '../../shared/email/queue/email-queue.service';
import { BackblazeService } from '../auth/infrastructure/storage/backblaze.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Activity', schema: ActivitySchema }
    ]),
    SharedEmailModule,
  ],
  controllers: [AdminController],
  providers: [
    ListAdminsUseCase,
    CreateAdminUseCase,
    UpdateAdminUseCase,
    SuspendAdminUseCase,
    ActivateAdminUseCase,
    RevokeAdminUseCase,
    AssignAdminUseCase,
    GetRolesSummaryUseCase,
    GetRoleDefinitionsUseCase,
    GetPermissionAnalysisUseCase,
    GetRoleChangeHistoryUseCase,
    GetAdminProfileUseCase,
    GetSecuritySettingsUseCase,
    GetAccountActivityUseCase,
    GetNotificationPreferencesUseCase,
    UpdateAdminProfileUseCase,
    ChangePasswordUseCase,
    UpdateNotificationPreferencesUseCase,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryImpl,
    },
    {
      provide: 'PasswordService',
      useClass: PasswordService,
    },
    {
      provide: 'EmailQueueService',
      useExisting: EmailQueueService,
    },
    BackblazeService,
    ActivityLoggingService,
  ],
  exports: [],
})
export class AdminModule {}
