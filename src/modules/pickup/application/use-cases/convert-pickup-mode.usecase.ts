import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';

@Injectable()
export class ConvertPickupModeUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(id: string, convertedBy: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }

    if (['completed', 'cancelled', 'failed'].includes(pickup.status)) {
      throw new BadRequestException(
        `Cannot convert pickup mode for request with status '${pickup.status}'.`,
      );
    }

    const newMode = pickup.pickupMode === 'pickup' ? 'dropoff' : 'pickup';

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'reassigned',
      timestamp: new Date().toISOString(),
      details: `Pickup mode converted from '${pickup.pickupMode}' to '${newMode}' by ${convertedBy}`,
    };

    await this.pickupRepository.addMatchingEvent(id, event);

    return this.pickupRepository.update(id, { pickupMode: newMode });
  }
}
