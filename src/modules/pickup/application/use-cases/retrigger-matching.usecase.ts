import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';
import { SLA_DEADLINE_MINUTES } from '../../domain/constants/pickup.constants';

@Injectable()
export class RetriggerMatchingUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(id: string, retriggeredBy: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }

    if (!['failed', 'cancelled'].includes(pickup.status)) {
      throw new BadRequestException(
        `Cannot re-trigger matching for pickup with status '${pickup.status}'. Must be 'failed' or 'cancelled'.`,
      );
    }

    const slaMinutes = SLA_DEADLINE_MINUTES[pickup.pickupMode] || 60;
    const newSlaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'matching_started',
      timestamp: new Date().toISOString(),
      details: `Matching re-triggered by ${retriggeredBy}`,
    };

    await this.pickupRepository.addMatchingEvent(id, event);

    return this.pickupRepository.updateStatus(id, 'matching', {
      slaDeadline: newSlaDeadline,
      failureReason: undefined,
      delayReason: undefined,
      assignedAgentId: undefined,
      assignedAgentName: undefined,
    });
  }
}
