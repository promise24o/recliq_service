import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleDetailsController } from './presentation/controllers/vehicle-details.controller';
import { VehicleEnumsController } from './presentation/controllers/vehicle-enums.controller';
import { VehicleApprovalController } from './presentation/controllers/vehicle-approval.controller';
import { GetVehicleDetailsUseCase } from './application/use-cases/get-vehicle-details.usecase';
import { CreateVehicleDetailsUseCase } from './application/use-cases/create-vehicle-details.usecase';
import { UpdateVehicleDetailsUseCase } from './application/use-cases/update-vehicle-details.usecase';
import { UploadVehicleDocumentUseCase } from './application/use-cases/upload-vehicle-document.usecase';
import { UpdateVehicleStatusUseCase } from './application/use-cases/update-vehicle-status.usecase';
import { ApproveVehicleUseCase } from './application/use-cases/approve-vehicle.usecase';
import { GetPendingVehiclesUseCase } from './application/use-cases/get-pending-vehicles.usecase';
import { GetAllVehiclesUseCase } from './application/use-cases/get-all-vehicles.usecase';
import { GetVehicleWithUserUseCase } from './application/use-cases/get-vehicle-with-user.usecase';
import { VerifyVehicleDocumentUseCase } from './application/use-cases/verify-vehicle-document.usecase';
import { VehicleDetailsRepository } from './infrastructure/repositories/vehicle-details.repository.impl';
import { VehicleDetailsSchema } from './infrastructure/persistence/vehicle-details.model';
import { VehicleFileUploadService } from './infrastructure/services/vehicle-file-upload.service';
// import { VehicleNotificationService } from './infrastructure/services/vehicle-notification.service';
import { AuthModule } from '../auth/auth.module';
import { UserRepository } from '../users/infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY_TOKEN } from '../users/domain/repositories/user.repository.token';
import { SharedEmailModule } from '../../shared/email/shared-email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'VehicleDetails', schema: VehicleDetailsSchema },
      { name: 'User', schema: require('../auth/infrastructure/persistence/user.model').UserSchema },
      { name: 'Kyc', schema: require('../kyc/infrastructure/persistence/kyc.model').KycSchema }
    ]),
    AuthModule,
    SharedEmailModule,
    NotificationsModule
  ],
  controllers: [VehicleDetailsController, VehicleEnumsController, VehicleApprovalController],
  providers: [
    {
      provide: 'IVehicleDetailsRepository',
      useClass: VehicleDetailsRepository,
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    VehicleFileUploadService,
    // VehicleNotificationService, // TODO: Fix import issue
    GetVehicleDetailsUseCase,
    CreateVehicleDetailsUseCase,
    UpdateVehicleDetailsUseCase,
    UploadVehicleDocumentUseCase,
    UpdateVehicleStatusUseCase,
    ApproveVehicleUseCase,
    GetPendingVehiclesUseCase,
    GetAllVehiclesUseCase,
    GetVehicleWithUserUseCase,
    VerifyVehicleDocumentUseCase,
  ],
  exports: [
    'IVehicleDetailsRepository',
    GetVehicleDetailsUseCase,
    CreateVehicleDetailsUseCase,
    UpdateVehicleDetailsUseCase,
    UploadVehicleDocumentUseCase,
    UpdateVehicleStatusUseCase,
  ],
})
export class VehicleDetailsModule {}
