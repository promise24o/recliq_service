import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RiskManagementController } from './presentation/controllers/risk-management.controller';
import { RiskManagementUseCase } from './application/use-cases/risk-management.usecase';
import { RiskRepositoryImpl } from './infrastructure/repositories/risk.repository.impl';
import { RiskEventSchema } from './infrastructure/persistence/risk-event.schema';
import { IRiskRepository } from './domain/repositories/risk.repository';
import { RISK_REPOSITORY_TOKEN } from './domain/repositories/risk.repository.token';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'RiskEvent', schema: RiskEventSchema }]),
    UsersModule,
    WalletModule,
  ],
  controllers: [RiskManagementController],
  providers: [
    RiskManagementUseCase,
    {
      provide: RISK_REPOSITORY_TOKEN,
      useClass: RiskRepositoryImpl,
    },
  ],
  exports: [RiskManagementUseCase, RISK_REPOSITORY_TOKEN],
})
export class RiskModule {}
