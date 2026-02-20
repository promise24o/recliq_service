import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';

@Injectable()
export class ActivateDeactivateZoneUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(id: string, isActive: boolean, updatedBy: string): Promise<Zone> {
    // Check if zone exists
    const zone = await this.zoneRepository.findById(id);
    if (!zone) {
      throw new Error('Zone not found');
    }

    // Update zone status
    const updatedZone = await this.zoneRepository.update(id, {
      status: isActive ? 'active' : 'inactive',
      lastChangedBy: updatedBy,
    });

    return updatedZone;
  }
}
