import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceRadiusController } from './presentation/controllers/service-radius.controller';
import { GetServiceRadiusUseCase } from './application/use-cases/get-service-radius.usecase';
import { UpdateServiceRadiusUseCase } from './application/use-cases/update-service-radius.usecase';
import { ServiceRadiusRepository } from './infrastructure/repositories/service-radius.repository.impl';
import { ServiceRadiusSchema } from './infrastructure/persistence/service-radius.model';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceRadius', schema: ServiceRadiusSchema }
    ]),
    ZonesModule
  ],
  controllers: [ServiceRadiusController],
  providers: [
    {
      provide: 'IServiceRadiusRepository',
      useClass: ServiceRadiusRepository,
    },
    GetServiceRadiusUseCase,
    UpdateServiceRadiusUseCase,
  ],
  exports: [
    'IServiceRadiusRepository',
    GetServiceRadiusUseCase,
    UpdateServiceRadiusUseCase,
  ],
})
export class ServiceRadiusModule {}
