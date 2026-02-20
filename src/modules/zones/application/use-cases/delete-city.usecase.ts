import { Injectable, Inject } from '@nestjs/common';
import type { ICityRepository } from '../../domain/repositories/city.repository';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';

@Injectable()
export class DeleteCityUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Check if city exists
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new Error('City not found');
    }

    // Check if city has associated zones
    const zones = await this.zoneRepository.findByCity(city.name);
    if (zones.length > 0) {
      throw new Error(`Cannot delete city '${city.name}' because it has ${zones.length} associated zones. Delete the zones first or disable the city instead.`);
    }

    // Delete the city
    await this.cityRepository.delete(id);
  }
}
