import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PickupController } from './presentation/controllers/pickup.controller';
import { PickupGateway } from './presentation/gateways/pickup.gateway';
import { CreatePickupRequestUseCase } from './application/use-cases/create-pickup-request.usecase';
import { GetPickupRequestsUseCase } from './application/use-cases/get-pickup-requests.usecase';
import { GetPickupRequestUseCase } from './application/use-cases/get-pickup-request.usecase';
import { UpdatePickupStatusUseCase } from './application/use-cases/update-pickup-status.usecase';
import { AssignAgentUseCase } from './application/use-cases/assign-agent.usecase';
import { CancelPickupRequestUseCase } from './application/use-cases/cancel-pickup-request.usecase';
import { ConvertPickupModeUseCase } from './application/use-cases/convert-pickup-mode.usecase';
import { EscalatePickupRequestUseCase } from './application/use-cases/escalate-pickup-request.usecase';
import { RetriggerMatchingUseCase } from './application/use-cases/retrigger-matching.usecase';
import { GetPickupSummaryUseCase } from './application/use-cases/get-pickup-summary.usecase';
import { GetPickupFunnelUseCase } from './application/use-cases/get-pickup-funnel.usecase';
import { GetFailureAnalysisUseCase } from './application/use-cases/get-failure-analysis.usecase';
import { GetAvailableAgentsUseCase } from './application/use-cases/get-available-agents.usecase';
import { AgentRespondToPickupUseCase } from './application/use-cases/agent-respond-pickup.usecase';
import { PickupRepositoryImpl } from './infrastructure/persistence/pickup.repository.impl';
import { PickupSchema } from './infrastructure/persistence/pickup.model';
import { ZoneValidationService } from './application/services/zone-validation.service';
import { AgentAvailabilityService } from './application/services/agent-availability.service';
import { AgentMatchingService } from './application/services/agent-matching.service';
import { NotificationService } from '../../shared/services/notification.service';
import { LocationTrackingService } from '../../shared/services/location-tracking.service';
import { ZonesModule } from '../zones/zones.module';
import { AgentAvailabilityModule } from '../agent-availability/agent-availability.module';
import { ServiceRadiusModule } from '../service-radius/service-radius.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Pickup', schema: PickupSchema },
    ]),
    ZonesModule,
    AgentAvailabilityModule,
    ServiceRadiusModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [PickupController],
  providers: [
    {
      provide: 'IPickupRepository',
      useClass: PickupRepositoryImpl,
    },
    PickupGateway,
    CreatePickupRequestUseCase,
    GetPickupRequestsUseCase,
    GetPickupRequestUseCase,
    UpdatePickupStatusUseCase,
    AssignAgentUseCase,
    CancelPickupRequestUseCase,
    ConvertPickupModeUseCase,
    EscalatePickupRequestUseCase,
    RetriggerMatchingUseCase,
    GetPickupSummaryUseCase,
    GetPickupFunnelUseCase,
    GetFailureAnalysisUseCase,
    GetAvailableAgentsUseCase,
    AgentRespondToPickupUseCase,
    ZoneValidationService,
    AgentAvailabilityService,
    AgentMatchingService,
    NotificationService,
    LocationTrackingService,
  ],
  exports: [
    'IPickupRepository',
    GetPickupRequestsUseCase,
    GetPickupSummaryUseCase,
    PickupGateway,
  ],
})
export class PickupModule {}
