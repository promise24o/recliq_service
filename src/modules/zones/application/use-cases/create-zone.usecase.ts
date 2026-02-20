import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import type { ICityRepository } from '../../domain/repositories/city.repository';
import { CreateZoneDto } from '../../presentation/dto/create-zone.dto';

@Injectable()
export class CreateZoneUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
  ) {}

  async execute(zoneData: CreateZoneDto, createdBy: string): Promise<Zone> {
    // Check if city exists and is active
    const city = await this.cityRepository.findByName(zoneData.city);
    if (!city) {
      throw new Error(`City '${zoneData.city}' not found`);
    }
    
    if (!city.isActive) {
      throw new Error(`City '${zoneData.city}' is not active. Cannot create zones in inactive cities.`);
    }

    // Check if zone with same name already exists in the city
    const existingZone = await this.zoneRepository.findByNameAndCity(zoneData.name, zoneData.city);
    if (existingZone) {
      throw new Error(`Zone '${zoneData.name}' already exists in '${zoneData.city}'`);
    }

    // Create the zone
    const now = new Date().toISOString();
    const zone: Zone = {
      id: `ZN-${Date.now().toString(36).toUpperCase()}`,
      name: zoneData.name,
      city: zoneData.city,
      state: zoneData.state,
      description: zoneData.description,
      boundary: zoneData.boundary,
      status: zoneData.status || 'pending',
      coverageLevel: zoneData.coverageLevel,
      activeAgents: zoneData.activeAgents || 0,
      totalAgents: zoneData.totalAgents,
      pricingRuleId: zoneData.pricingRuleId || 'DEFAULT',
      pricingRuleName: zoneData.pricingRuleName || 'Default Pricing',
      slaTier: zoneData.slaTier,
      pickupAvailability: zoneData.pickupAvailability || [],
      dropoffEligible: zoneData.dropoffEligible || true,
      avgPickupsPerDay: zoneData.avgPickupsPerDay || 0,
      avgDropoffsPerDay: zoneData.avgDropoffsPerDay || 0,
      demandIntensity: zoneData.demandIntensity,
      coverageGapPercent: 100, // Will be calculated based on actual performance
      enterpriseClients: zoneData.enterpriseClients || [],
      contractOverrides: 0,
      performance: {
        avgPickupTimeMins: 0,
        completionRatePercent: 0,
        agentIdlePercent: 0,
        slaCompliancePercent: 0,
        utilizationPercent: 0,
      },
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy,
      lastChangedBy: createdBy,
    };

    return await this.zoneRepository.create(zone);
  }
}
