import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';

@Injectable()
export class GetZonesUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(filters?: {
    city?: string;
    state?: string;
    status?: string;
    coverageLevel?: string;
  }): Promise<Zone[]> {
    return await this.zoneRepository.findAll(filters);
  }

  async getZonesByCity(city: string): Promise<Zone[]> {
    return await this.zoneRepository.findByCity(city);
  }
}
