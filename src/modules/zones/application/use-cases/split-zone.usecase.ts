import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import { SplitZoneDto } from '../../presentation/dto/split-zone.dto';

@Injectable()
export class SplitZoneUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(splitData: SplitZoneDto, updatedBy: string): Promise<{ zone1: Zone; zone2: Zone; archivedZone: Zone }> {
    // Check if original zone exists
    const originalZone = await this.zoneRepository.findById(splitData.zoneId);
    if (!originalZone) {
      throw new Error('Zone not found');
    }

    // Check if zone names already exist in the same city
    const existingZone1 = await this.zoneRepository.findByNameAndCity(splitData.zone1.name, originalZone.city);
    if (existingZone1) {
      throw new Error(`Zone '${splitData.zone1.name}' already exists in '${originalZone.city}'`);
    }

    const existingZone2 = await this.zoneRepository.findByNameAndCity(splitData.zone2.name, originalZone.city);
    if (existingZone2) {
      throw new Error(`Zone '${splitData.zone2.name}' already exists in '${originalZone.city}'`);
    }

    const now = new Date().toISOString();

    // Create first new zone
    const zone1: Zone = {
      id: `ZN-${Date.now().toString(36).toUpperCase()}-1`,
      name: splitData.zone1.name,
      city: originalZone.city,
      state: originalZone.state,
      description: splitData.zone1.description,
      boundary: {
        polygon: splitData.zone1.polygon,
        center: { lat: splitData.zone1.centerLat, lng: splitData.zone1.centerLng },
        areaKm2: splitData.zone1.areaKm2,
      },
      status: 'active',
      coverageLevel: splitData.zone1.coverageLevel as any,
      activeAgents: splitData.agentDistribution.zone1Agents,
      totalAgents: splitData.zone1.totalAgents,
      pricingRuleId: splitData.zone1.pricingRuleId,
      pricingRuleName: splitData.zone1.pricingRuleName,
      slaTier: splitData.zone1.slaTier as any,
      pickupAvailability: splitData.zone1.pickupAvailability,
      dropoffEligible: splitData.zone1.dropoffEligible,
      avgPickupsPerDay: Math.floor(originalZone.avgPickupsPerDay * (splitData.zone1.areaKm2 / originalZone.boundary.areaKm2)),
      avgDropoffsPerDay: Math.floor(originalZone.avgDropoffsPerDay * (splitData.zone1.areaKm2 / originalZone.boundary.areaKm2)),
      demandIntensity: splitData.zone1.demandIntensity as any,
      coverageGapPercent: originalZone.coverageGapPercent,
      enterpriseClients: splitData.zone1.enterpriseClients || [],
      contractOverrides: originalZone.contractOverrides,
      performance: { ...originalZone.performance },
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: updatedBy,
      lastChangedBy: updatedBy,
    };

    // Create second new zone
    const zone2: Zone = {
      id: `ZN-${Date.now().toString(36).toUpperCase()}-2`,
      name: splitData.zone2.name,
      city: originalZone.city,
      state: originalZone.state,
      description: splitData.zone2.description,
      boundary: {
        polygon: splitData.zone2.polygon,
        center: { lat: splitData.zone2.centerLat, lng: splitData.zone2.centerLng },
        areaKm2: splitData.zone2.areaKm2,
      },
      status: 'active',
      coverageLevel: splitData.zone2.coverageLevel as any,
      activeAgents: splitData.agentDistribution.zone2Agents,
      totalAgents: splitData.zone2.totalAgents,
      pricingRuleId: splitData.zone2.pricingRuleId,
      pricingRuleName: splitData.zone2.pricingRuleName,
      slaTier: splitData.zone2.slaTier as any,
      pickupAvailability: splitData.zone2.pickupAvailability,
      dropoffEligible: splitData.zone2.dropoffEligible,
      avgPickupsPerDay: Math.floor(originalZone.avgPickupsPerDay * (splitData.zone2.areaKm2 / originalZone.boundary.areaKm2)),
      avgDropoffsPerDay: Math.floor(originalZone.avgDropoffsPerDay * (splitData.zone2.areaKm2 / originalZone.boundary.areaKm2)),
      demandIntensity: splitData.zone2.demandIntensity as any,
      coverageGapPercent: originalZone.coverageGapPercent,
      enterpriseClients: splitData.zone2.enterpriseClients || [],
      contractOverrides: originalZone.contractOverrides,
      performance: { ...originalZone.performance },
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: updatedBy,
      lastChangedBy: updatedBy,
    };

    // Archive original zone
    const archivedZone = await this.zoneRepository.update(originalZone.id, {
      status: 'archived',
      lastChangedBy: updatedBy,
    });

    // Create new zones
    const createdZone1 = await this.zoneRepository.create(zone1);
    const createdZone2 = await this.zoneRepository.create(zone2);

    return {
      zone1: createdZone1,
      zone2: createdZone2,
      archivedZone,
    };
  }
}
