import { Injectable, BadRequestException } from '@nestjs/common';
import { ZoneValidationService } from './zone-validation.service';
import { AgentAvailabilityService, AvailableAgent } from './agent-availability.service';
import { Coordinates } from '../../domain/types/pickup.types';

export interface MatchingResult {
  serviceable: boolean;
  zoneId?: string;
  city?: string;
  zone?: string;
  assignedAgent?: AvailableAgent;
  availableAgents?: AvailableAgent[];
  message?: string;
  zonesFound: boolean;
}

@Injectable()
export class AgentMatchingService {
  constructor(
    private readonly zoneValidationService: ZoneValidationService,
    private readonly agentAvailabilityService: AgentAvailabilityService,
  ) {}

  async matchAgentAuto(userLocation: Coordinates): Promise<MatchingResult> {
    const zoneValidation = await this.zoneValidationService.validateLocation(userLocation);

    if (!zoneValidation.serviceable) {
      return {
        serviceable: false,
        zonesFound: zoneValidation.zonesFound,
        message: zoneValidation.message,
      };
    }

    const closestAgent = await this.agentAvailabilityService.findClosestAgent(
      userLocation,
      zoneValidation.zoneId!,
    );

    if (!closestAgent) {
      return {
        serviceable: false,
        zonesFound: true,
        zoneId: zoneValidation.zoneId,
        city: zoneValidation.city,
        zone: zoneValidation.zone,
        message: 'No available agents found in your area at the moment. Please try again later.',
      };
    }

    return {
      serviceable: true,
      zonesFound: true,
      zoneId: zoneValidation.zoneId,
      city: zoneValidation.city,
      zone: zoneValidation.zone,
      assignedAgent: closestAgent,
    };
  }

  async getAvailableAgentsForManualSelection(userLocation: Coordinates): Promise<MatchingResult> {
    const zoneValidation = await this.zoneValidationService.validateLocation(userLocation);

    if (!zoneValidation.serviceable) {
      return {
        serviceable: false,
        zonesFound: zoneValidation.zonesFound,
        message: zoneValidation.message,
      };
    }

    const availableAgents = await this.agentAvailabilityService.findAvailableAgents(
      userLocation,
      zoneValidation.zoneId!,
    );

    if (availableAgents.length === 0) {
      return {
        serviceable: false,
        zonesFound: true,
        zoneId: zoneValidation.zoneId,
        city: zoneValidation.city,
        zone: zoneValidation.zone,
        message: 'No available agents found in your area at the moment. Please try again later.',
      };
    }

    return {
      serviceable: true,
      zonesFound: true,
      zoneId: zoneValidation.zoneId,
      city: zoneValidation.city,
      zone: zoneValidation.zone,
      availableAgents,
    };
  }

  async validateManualAgentSelection(
    userLocation: Coordinates,
    selectedAgentId: string,
  ): Promise<MatchingResult> {
    const result = await this.getAvailableAgentsForManualSelection(userLocation);

    if (!result.serviceable || !result.availableAgents) {
      return result;
    }

    const selectedAgent = result.availableAgents.find(
      agent => agent.agentId === selectedAgentId,
    );

    if (!selectedAgent) {
      throw new BadRequestException(
        'Selected agent is not available. Please choose from the available agents list.',
      );
    }

    return {
      serviceable: true,
      zonesFound: result.zonesFound,
      zoneId: result.zoneId,
      city: result.city,
      zone: result.zone,
      assignedAgent: selectedAgent,
    };
  }
}
