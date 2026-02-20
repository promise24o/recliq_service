import { Injectable, Inject } from '@nestjs/common';
import type { City } from '../../domain/types/zone.types';
import type { ICityRepository } from '../../domain/repositories/city.repository';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import { UpdateCityDto } from '../../presentation/dto/update-city.dto';

@Injectable()
export class UpdateCityUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(id: string, updates: UpdateCityDto, updatedBy: string): Promise<City> {
    // Check if city exists
    const existingCity = await this.cityRepository.findById(id);
    if (!existingCity) {
      throw new Error('City not found');
    }

    // Check if name is being changed and if new name already exists
    if (updates.name && updates.name !== existingCity.name) {
      const cityWithSameName = await this.cityRepository.findByName(updates.name);
      if (cityWithSameName) {
        throw new Error(`City with name '${updates.name}' already exists`);
      }
    }

    // Update the city
    const updatedCity = await this.cityRepository.update(id, {
      ...updates,
      lastChangedBy: updatedBy,
    });

    // If city is being disabled, also disable all associated zones
    if (updates.isActive === false && existingCity.isActive) {
      await this.disableAssociatedZones(existingCity.name, updatedBy);
    }

    return updatedCity;
  }

  private async disableAssociatedZones(cityName: string, updatedBy: string): Promise<void> {
    const zones = await this.zoneRepository.findByCity(cityName);
    
    for (const zone of zones) {
      if (zone.status === 'active') {
        await this.zoneRepository.update(zone.id, {
          status: 'inactive',
          lastChangedBy: updatedBy,
        });
      }
    }
  }
}
