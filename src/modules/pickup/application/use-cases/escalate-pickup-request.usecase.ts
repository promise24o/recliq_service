import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';

@Injectable()
export class EscalatePickupRequestUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(id: string, escalatedTo: string, escalatedBy: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }

    if (['completed', 'cancelled'].includes(pickup.status)) {
      throw new BadRequestException(
        `Cannot escalate pickup with status '${pickup.status}'.`,
      );
    }

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'reassigned',
      timestamp: new Date().toISOString(),
      details: `Request escalated to ${escalatedTo} by ${escalatedBy}`,
    };

    await this.pickupRepository.addMatchingEvent(id, event);

    return this.pickupRepository.update(id, {
      escalatedTo,
      escalatedAt: new Date().toISOString(),
    });
  }
}
