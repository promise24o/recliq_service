import { Injectable, Inject } from '@nestjs/common';
import type { City } from '../../domain/types/zone.types';
import type { ICityRepository } from '../../domain/repositories/city.repository';

@Injectable()
export class GetCitiesUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
  ) {}

  async execute(filters?: {
    state?: string;
    isActive?: boolean;
  }): Promise<City[]> {
    return await this.cityRepository.findAll(filters);
  }

  async getCitiesWithZoneCount(): Promise<Array<City & { zoneCount: number }>> {
    return await this.cityRepository.getCitiesWithZoneCount();
  }
}
