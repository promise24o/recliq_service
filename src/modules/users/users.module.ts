import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './presentation/controllers/users.controller';
import { GetUsersUseCase } from './application/use-cases/get-users.usecase';
import { GetUserSummaryUseCase } from './application/use-cases/get-user-summary.usecase';
import { GetUserDetailUseCase } from './application/use-cases/get-user-detail.usecase';
import { UserActionUseCase } from './application/use-cases/user-action.usecase';
import { ExportUsersUseCase } from './application/use-cases/export-users.usecase';
import { UserRepository } from './infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user.repository.token';
import { UserSchema } from '../auth/infrastructure/persistence/user.model';
import { KycSchema } from '../kyc/infrastructure/persistence/kyc.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Kyc', schema: KycSchema }
    ])
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    GetUsersUseCase,
    GetUserSummaryUseCase,
    GetUserDetailUseCase,
    UserActionUseCase,
    ExportUsersUseCase,
  ],
  exports: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    GetUsersUseCase,
    GetUserSummaryUseCase,
    GetUserDetailUseCase,
    UserActionUseCase,
    ExportUsersUseCase,
  ],
})
export class UsersModule {}
