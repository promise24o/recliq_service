import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';

@Injectable()
export class AssignAgentUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(pickupId: string, agentId: string, agentName: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(pickupId);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${pickupId} not found`);
    }

    if (!['new', 'matching'].includes(pickup.status)) {
      throw new BadRequestException(
        `Cannot assign agent to pickup with status '${pickup.status}'. Must be 'new' or 'matching'.`,
      );
    }

    const existingActive = await this.pickupRepository.findActiveByAgentId(agentId);
    if (existingActive) {
      throw new BadRequestException(
        `Agent ${agentName} already has an active pickup (${existingActive.id}). Complete or cancel it first.`,
      );
    }

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'agent_accepted',
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      details: `Agent ${agentName} manually assigned to request`,
    };

    await this.pickupRepository.addMatchingEvent(pickupId, event);

    return this.pickupRepository.updateStatus(pickupId, 'assigned', {
      assignedAgentId: agentId,
      assignedAgentName: agentName,
    });
  }
}
