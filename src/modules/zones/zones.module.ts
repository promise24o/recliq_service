import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZonesController } from './presentation/controllers/zones.controller';
import { CreateCityUseCase } from './application/use-cases/create-city.usecase';
import { GetCitiesUseCase } from './application/use-cases/get-cities.usecase';
import { GetCityUseCase } from './application/use-cases/get-city.usecase';
import { UpdateCityUseCase } from './application/use-cases/update-city.usecase';
import { DeleteCityUseCase } from './application/use-cases/delete-city.usecase';
import { EnableDisableCityUseCase } from './application/use-cases/enable-disable-city.usecase';
import { CreateZoneUseCase } from './application/use-cases/create-zone.usecase';
import { UpdateZoneUseCase } from './application/use-cases/update-zone.usecase';
import { ActivateDeactivateZoneUseCase } from './application/use-cases/activate-deactivate-zone.usecase';
import { SplitZoneUseCase } from './application/use-cases/split-zone.usecase';
import { MergeZonesUseCase } from './application/use-cases/merge-zones.usecase';
import { GetZonesUseCase } from './application/use-cases/get-zones.usecase';
import { GetZoneSummaryUseCase } from './application/use-cases/get-zone-summary.usecase';
import { GetZoneInsightsUseCase } from './application/use-cases/get-zone-insights.usecase';
import { ZoneRepositoryImpl } from './infrastructure/persistence/zone.repository.impl';
import { CityRepositoryImpl } from './infrastructure/persistence/city.repository.impl';
import { ZoneSchema } from './infrastructure/persistence/zone.model';
import { CitySchema } from './infrastructure/persistence/city.model';
import { IZoneRepository } from './domain/repositories/zone.repository';
import { ICityRepository } from './domain/repositories/city.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Zone', schema: ZoneSchema },
      { name: 'City', schema: CitySchema }
    ]),
  ],
  controllers: [ZonesController],
  providers: [
    CreateCityUseCase,
    GetCitiesUseCase,
    GetCityUseCase,
    UpdateCityUseCase,
    DeleteCityUseCase,
    EnableDisableCityUseCase,
    CreateZoneUseCase,
    UpdateZoneUseCase,
    ActivateDeactivateZoneUseCase,
    SplitZoneUseCase,
    MergeZonesUseCase,
    GetZonesUseCase,
    GetZoneSummaryUseCase,
    GetZoneInsightsUseCase,
    {
      provide: 'IZoneRepository',
      useClass: ZoneRepositoryImpl,
    },
    {
      provide: 'ICityRepository',
      useClass: CityRepositoryImpl,
    },
  ],
  exports: [
    'IZoneRepository',
    'ICityRepository',
  ],
})
export class ZonesModule {}
