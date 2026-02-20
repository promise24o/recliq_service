import { Injectable, Inject } from '@nestjs/common';
import type { Zone } from '../../domain/types/zone.types';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import { MergeZonesDto } from '../../presentation/dto/merge-zones.dto';

@Injectable()
export class MergeZonesUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(mergeData: MergeZonesDto, updatedBy: string): Promise<{ mergedZone: Zone; archivedZones: Zone[] }> {
    // Check if all zones exist
    const zonesToMerge = await Promise.all(
      mergeData.zoneIds.map(id => this.zoneRepository.findById(id))
    );

    if (zonesToMerge.some(zone => !zone)) {
      throw new Error('One or more zones not found');
    }

    // Filter out null zones and cast to Zone array
    const validZones = zonesToMerge.filter((zone): zone is Zone => zone !== null);

    // Check if all zones are in the same city
    const cities = [...new Set(validZones.map(zone => zone.city))];
    if (cities.length > 1) {
      throw new Error('All zones must be in the same city to merge');
    }

    // Check if merged zone name already exists in the city
    const existingZone = await this.zoneRepository.findByNameAndCity(
      mergeData.mergedZone.name, 
      cities[0]
    );
    if (existingZone) {
      throw new Error(`Zone '${mergeData.mergedZone.name}' already exists in '${cities[0]}'`);
    }

    const now = new Date().toISOString();

    // Calculate combined metrics
    const totalArea = mergeData.mergedZone.areaKm2;
    const totalAgents = mergeData.mergedZone.totalAgents;
    const totalPickups = validZones.reduce((sum, zone) => sum + zone.avgPickupsPerDay, 0);
    const totalDropoffs = validZones.reduce((sum, zone) => sum + zone.avgDropoffsPerDay, 0);
    const allEnterpriseClients = [...new Set(
      validZones.flatMap(zone => zone.enterpriseClients)
    )];

    // Create merged zone
    const mergedZone: Zone = {
      id: `ZN-${Date.now().toString(36).toUpperCase()}`,
      name: mergeData.mergedZone.name,
      city: cities[0],
      state: validZones[0]!.state,
      description: mergeData.mergedZone.description,
      boundary: {
        polygon: mergeData.mergedZone.polygon,
        center: { lat: mergeData.mergedZone.centerLat, lng: mergeData.mergedZone.centerLng },
        areaKm2: mergeData.mergedZone.areaKm2,
      },
      status: 'active',
      coverageLevel: mergeData.mergedZone.coverageLevel as any,
      activeAgents: totalAgents,
      totalAgents: totalAgents,
      pricingRuleId: mergeData.mergedZone.pricingRuleId,
      pricingRuleName: mergeData.mergedZone.pricingRuleName,
      slaTier: mergeData.mergedZone.slaTier as any,
      pickupAvailability: mergeData.mergedZone.pickupAvailability,
      dropoffEligible: mergeData.mergedZone.dropoffEligible,
      avgPickupsPerDay: totalPickups,
      avgDropoffsPerDay: totalDropoffs,
      demandIntensity: mergeData.mergedZone.demandIntensity as any,
      coverageGapPercent: Math.max(...validZones.map(zone => zone.coverageGapPercent)),
      enterpriseClients: allEnterpriseClients,
      contractOverrides: validZones.reduce((sum, zone) => sum + zone.contractOverrides, 0),
      performance: {
        avgPickupTimeMins: validZones.reduce((sum, zone) => sum + zone.performance.avgPickupTimeMins, 0) / validZones.length,
        completionRatePercent: validZones.reduce((sum, zone) => sum + zone.performance.completionRatePercent, 0) / validZones.length,
        agentIdlePercent: validZones.reduce((sum, zone) => sum + zone.performance.agentIdlePercent, 0) / validZones.length,
        slaCompliancePercent: validZones.reduce((sum, zone) => sum + zone.performance.slaCompliancePercent, 0) / validZones.length,
        utilizationPercent: validZones.reduce((sum, zone) => sum + zone.performance.utilizationPercent, 0) / validZones.length,
      },
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: updatedBy,
      lastChangedBy: updatedBy,
    };

    // Archive original zones
    const archivedZones = await Promise.all(
      mergeData.zoneIds.map(id => 
        this.zoneRepository.update(id, {
          status: 'archived',
          lastChangedBy: updatedBy,
        })
      )
    );

    // Create merged zone
    const createdMergedZone = await this.zoneRepository.create(mergedZone);

    return {
      mergedZone: createdMergedZone,
      archivedZones,
    };
  }
}
