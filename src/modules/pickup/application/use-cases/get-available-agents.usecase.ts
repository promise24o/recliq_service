import { Injectable } from '@nestjs/common';
import { AgentMatchingService } from '../services/agent-matching.service';
import { Coordinates } from '../../domain/types/pickup.types';
import { AvailableAgent } from '../services/agent-availability.service';

@Injectable()
export class GetAvailableAgentsUseCase {
  constructor(
    private readonly agentMatchingService: AgentMatchingService,
  ) {}

  async execute(coordinates: Coordinates): Promise<{
    serviceable: boolean;
    city?: string;
    zone?: string;
    agents: AvailableAgent[];
    message?: string;
  }> {
    const result = await this.agentMatchingService.getAvailableAgentsForManualSelection(coordinates);

    return {
      serviceable: result.serviceable,
      city: result.city,
      zone: result.zone,
      agents: result.availableAgents || [],
      message: result.message,
    };
  }
}
