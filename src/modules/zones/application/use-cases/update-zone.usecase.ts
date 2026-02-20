import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import { UpdateZoneDto } from '../../presentation/dto/update-zone.dto';

@Injectable()
export class UpdateZoneUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(id: string, updates: UpdateZoneDto, updatedBy: string): Promise<Zone> {
    // Check if zone exists
    const existingZone = await this.zoneRepository.findById(id);
    if (!existingZone) {
      throw new Error('Zone not found');
    }

    // Check if name is being changed and if new name already exists in the same city
    if (updates.name && updates.name !== existingZone.name) {
      const zoneWithSameName = await this.zoneRepository.findByNameAndCity(
        updates.name, 
        existingZone.city
      );
      if (zoneWithSameName) {
        throw new Error(`Zone '${updates.name}' already exists in '${existingZone.city}'`);
      }
    }

    // Prepare update data
    const updateData: Partial<Zone> = {
      ...updates,
      lastChangedBy: updatedBy,
    } as Partial<Zone>;

    // Update boundary if provided
    if (updates.boundary) {
      updateData.boundary = updates.boundary;
    }

    // Update the zone
    return await this.zoneRepository.update(id, updateData);
  }
}
