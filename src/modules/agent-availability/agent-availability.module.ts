import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AgentAvailabilityController } from './presentation/controllers/agent-availability.controller';
import { GetAgentAvailabilityUseCase } from './application/use-cases/get-agent-availability.usecase';
import { UpdateAgentAvailabilityUseCase } from './application/use-cases/update-agent-availability.usecase';
import { UpdateOnlineStatusUseCase } from './application/use-cases/update-online-status.usecase';
import { UpdateAgentLocationUseCase } from './application/use-cases/update-agent-location.usecase';
import { AgentAvailabilityRepository } from './infrastructure/repositories/agent-availability.repository.impl';
import { AgentAvailabilitySchema } from './infrastructure/persistence/agent-availability.model';
import { AgentLocationGateway } from './presentation/gateways/agent-location.gateway';
import { LocationTrackingService } from '../../shared/services/location-tracking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AgentAvailability', schema: AgentAvailabilitySchema }
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-access-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AgentAvailabilityController],
  providers: [
    {
      provide: 'IAgentAvailabilityRepository',
      useClass: AgentAvailabilityRepository,
    },
    GetAgentAvailabilityUseCase,
    UpdateAgentAvailabilityUseCase,
    UpdateOnlineStatusUseCase,
    UpdateAgentLocationUseCase,
    LocationTrackingService,
    AgentLocationGateway,
  ],
  exports: [
    'IAgentAvailabilityRepository',
    GetAgentAvailabilityUseCase,
    UpdateAgentAvailabilityUseCase,
    UpdateOnlineStatusUseCase,
    UpdateAgentLocationUseCase,
    LocationTrackingService,
  ],
})
export class AgentAvailabilityModule {}
