import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Domain
import { KycEntity } from './domain/entities/kyc.entity';
import { IKycRepository } from './domain/repositories/kyc.repository';

// Infrastructure
import { KycSchema } from './infrastructure/persistence/kyc.model';
import { KycRepositoryImpl } from './infrastructure/persistence/kyc.repository.impl';
import { PaystackService } from './infrastructure/services/paystack.service';
import { FileUploadService } from './infrastructure/services/file-upload.service';

// Application
import { GetKycStatusUseCase } from './application/use-cases/get-kyc-status.usecase';
import { InitializeKycUseCase } from './application/use-cases/initialize-kyc.usecase';
import { VerifyBvnUseCase } from './application/use-cases/verify-bvn.usecase';
import { UploadDocumentUseCase } from './application/use-cases/upload-document.usecase';
import { UpdateBusinessDetailsUseCase } from './application/use-cases/update-business-details.usecase';
import { AdminApprovalUseCase } from './application/use-cases/admin-approval.usecase';
import { GetUserDetailUseCase } from '../users/application/use-cases/get-user-detail.usecase';

// Presentation
import { KycController } from './presentation/controllers/kyc.controller';

// External modules
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: 'Kyc', schema: KycSchema }]),
    AuthModule,
    UsersModule,
  ],
  controllers: [KycController],
  providers: [
    // Repository
    {
      provide: 'IKycRepository',
      useClass: KycRepositoryImpl,
    },

    // Services
    PaystackService,
    FileUploadService,

    // Use Cases
    GetKycStatusUseCase,
    InitializeKycUseCase,
    VerifyBvnUseCase,
    UploadDocumentUseCase,
    UpdateBusinessDetailsUseCase,
    AdminApprovalUseCase,
    GetUserDetailUseCase,
  ],
  exports: [
    'IKycRepository',
    PaystackService,
    FileUploadService,
    GetKycStatusUseCase,
    InitializeKycUseCase,
    VerifyBvnUseCase,
    UploadDocumentUseCase,
    UpdateBusinessDetailsUseCase,
    AdminApprovalUseCase,
  ],
})
export class KycModule {}
