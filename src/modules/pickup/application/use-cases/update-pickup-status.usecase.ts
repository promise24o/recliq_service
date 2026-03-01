import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent, PickupStatus } from '../../domain/types/pickup.types';

@Injectable()
export class UpdatePickupStatusUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(id: string, newStatus: PickupStatus, actorId: string, actorName?: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }

    this.validateStatusTransition(pickup.status, newStatus);

    const additionalData: Partial<PickupRequest> = {};
    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: this.getEventType(newStatus),
      timestamp: new Date().toISOString(),
      agentId: actorId,
      agentName: actorName,
      details: this.getEventDetails(newStatus, actorName),
    };

    if (newStatus === 'completed') {
      additionalData.completedAt = new Date().toISOString();
    }

    if (newStatus === 'cancelled') {
      additionalData.cancelledAt = new Date().toISOString();
    }

    await this.pickupRepository.addMatchingEvent(id, event);
    return this.pickupRepository.updateStatus(id, newStatus, additionalData);
  }

  private validateStatusTransition(currentStatus: PickupStatus, newStatus: PickupStatus): void {
    const validTransitions: Record<string, string[]> = {
      new: ['matching', 'cancelled'],
      matching: ['pending_acceptance', 'failed', 'cancelled'],
      pending_acceptance: ['assigned', 'matching', 'cancelled', 'failed'],
      assigned: ['agent_en_route', 'cancelled', 'failed'],
      agent_en_route: ['arrived', 'cancelled', 'failed'],
      arrived: ['completed', 'cancelled', 'failed'],
      completed: [],
      cancelled: ['matching'],
      failed: ['matching'],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
  }

  private getEventType(status: PickupStatus): MatchingEvent['type'] {
    switch (status) {
      case 'matching': return 'matching_started';
      case 'assigned': return 'agent_accepted';
      case 'agent_en_route': return 'agent_notified';
      case 'arrived': return 'agent_notified';
      case 'completed': return 'agent_accepted';
      case 'failed': return 'timeout';
      case 'cancelled': return 'timeout';
      default: return 'matching_started';
    }
  }

  private getEventDetails(status: PickupStatus, actorName?: string): string {
    switch (status) {
      case 'matching': return 'Matching re-triggered';
      case 'assigned': return `Agent ${actorName || 'unknown'} accepted the request`;
      case 'agent_en_route': return `Agent ${actorName || 'unknown'} is en route to pickup location`;
      case 'arrived': return `Agent ${actorName || 'unknown'} has arrived at pickup location`;
      case 'completed': return 'Pickup completed successfully';
      case 'failed': return 'Pickup request failed';
      case 'cancelled': return 'Pickup request cancelled';
      default: return `Status changed to ${status}`;
    }
  }
}
