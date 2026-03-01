import { Injectable, Inject } from '@nestjs/common';
import type { IZoneRepository } from '../../../zones/domain/repositories/zone.repository';
import { Coordinates } from '../../domain/types/pickup.types';

@Injectable()
export class ZoneValidationService {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async validateLocation(coordinates: Coordinates): Promise<{ 
    serviceable: boolean;
    zoneId?: string;
    zone?: string; 
    city?: string; 
    message?: string;
    zonesFound: boolean;
  }> {
    const zones = await this.zoneRepository.findByCoordinates(coordinates.lat, coordinates.lng);

    if (!zones || zones.length === 0) {
      return {
        serviceable: false,
        zonesFound: false,
        message: 'No agents available in your area. We currently do not service this location.',
      };
    }

    const activeZone = zones.find(zone => zone.status === 'active');
    if (!activeZone) {
      return {
        serviceable: false,
        zonesFound: true,
        message: 'No agents available in your area. Service is currently unavailable in this zone.',
      };
    }

    return {
      serviceable: true,
      zonesFound: true,
      zoneId: activeZone.id,
      zone: activeZone.name,
      city: activeZone.city,
    };
  }
}
