import { Injectable, Inject } from '@nestjs/common';
import type { City } from '../../domain/types/zone.types';
import type { ICityRepository } from '../../domain/repositories/city.repository';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';

@Injectable()
export class EnableDisableCityUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(id: string, isActive: boolean, updatedBy: string): Promise<City> {
    // Check if city exists
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new Error('City not found');
    }

    // Update city status
    const updatedCity = await this.cityRepository.update(id, {
      isActive,
      lastChangedBy: updatedBy,
    });

    // If disabling city, also disable all associated zones
    if (!isActive) {
      await this.disableAssociatedZones(city.name, updatedBy);
    } else {
      // If enabling city, optionally enable active zones (you can modify this logic)
      await this.enableAssociatedZones(city.name, updatedBy);
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

  private async enableAssociatedZones(cityName: string, updatedBy: string): Promise<void> {
    const zones = await this.zoneRepository.findByCity(cityName);
    
    for (const zone of zones) {
      if (zone.status === 'inactive') {
        await this.zoneRepository.update(zone.id, {
          status: 'active',
          lastChangedBy: updatedBy,
        });
      }
    }
  }
}
