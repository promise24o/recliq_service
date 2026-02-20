import { Injectable, Inject } from '@nestjs/common';
import type { City } from '../../domain/types/zone.types';
import type { ICityRepository } from '../../domain/repositories/city.repository';
import { CreateCityDto } from '../../presentation/dto/create-city.dto';

@Injectable()
export class CreateCityUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
  ) {}

  async execute(cityData: CreateCityDto, createdBy: string): Promise<City> {
    // Check if city with same name already exists
    const existingCity = await this.cityRepository.findByName(cityData.name);
    if (existingCity) {
      throw new Error(`City with name '${cityData.name}' already exists`);
    }

    const city: Omit<City, 'id' | 'createdAt' | 'updatedAt'> = {
      name: cityData.name,
      state: cityData.state,
      center: {
        lat: cityData.lat,
        lng: cityData.lng,
      },
      isActive: cityData.isActive ?? true,
      timezone: cityData.timezone || 'Africa/Lagos',
      createdBy,
    };

    return await this.cityRepository.create(city);
  }
}
