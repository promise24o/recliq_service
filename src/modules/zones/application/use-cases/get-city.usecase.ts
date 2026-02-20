import { Injectable, Inject } from '@nestjs/common';
import type { City } from '../../domain/types/zone.types';
import type { ICityRepository } from '../../domain/repositories/city.repository';

@Injectable()
export class GetCityUseCase {
  constructor(
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
  ) {}

  async execute(id: string): Promise<City> {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new Error('City not found');
    }
    return city;
  }
}
