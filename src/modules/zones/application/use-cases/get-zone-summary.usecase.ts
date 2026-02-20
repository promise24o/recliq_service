import { Injectable, Inject } from '@nestjs/common';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import type { ICityRepository } from '../../domain/repositories/city.repository';

@Injectable()
export class GetZoneSummaryUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
    @Inject('ICityRepository')
    private readonly cityRepository: ICityRepository,
  ) {}

  async execute(): Promise<{
    citiesCovered: number;
    activeZones: number;
    agentsAssigned: number;
    lowCoverageZones: number;
    avgPickupsPerZone: number;
    avgSlaPerformancePercent: number;
    totalZones: number;
    inactiveZones: number;
    pendingZones: number;
    archivedZones: number;
    totalAgents: number;
    avgAgentsPerZone: number;
    highCoverageZones: number;
    mediumCoverageZones: number;
    criticalCoverageZones: number;
    totalDailyPickups: number;
    totalDailyDropoffs: number;
    avgZoneUtilization: number;
    zonesWithEnterpriseClients: number;
    zonesMeetingSla: number;
    zonesMissingSla: number;
  }> {
    // Get all zones and cities
    const zones = await this.zoneRepository.findAll();
    const cities = await this.cityRepository.findAll();

    // Calculate basic metrics
    const totalZones = zones.length;
    const activeZones = zones.filter(z => z.status === 'active').length;
    const inactiveZones = zones.filter(z => z.status === 'inactive').length;
    const pendingZones = zones.filter(z => z.status === 'pending').length;
    const archivedZones = zones.filter(z => z.status === 'archived').length;

    const citiesCovered = cities.filter(c => c.isActive).length;
    const totalAgents = zones.reduce((sum, z) => sum + z.totalAgents, 0);
    const agentsAssigned = zones.reduce((sum, z) => sum + z.activeAgents, 0);
    const avgAgentsPerZone = activeZones > 0 ? Math.round(agentsAssigned / activeZones * 10) / 10 : 0;

    // Coverage analysis
    const lowCoverageZones = zones.filter(z => z.coverageLevel === 'low' || z.coverageLevel === 'critical').length;
    const highCoverageZones = zones.filter(z => z.coverageLevel === 'high').length;
    const mediumCoverageZones = zones.filter(z => z.coverageLevel === 'medium').length;
    const criticalCoverageZones = zones.filter(z => z.coverageLevel === 'critical').length;

    // Performance metrics
    const totalDailyPickups = zones.reduce((sum, z) => sum + z.avgPickupsPerDay, 0);
    const totalDailyDropoffs = zones.reduce((sum, z) => sum + z.avgDropoffsPerDay, 0);
    const avgPickupsPerZone = activeZones > 0 ? Math.round(totalDailyPickups / activeZones * 10) / 10 : 0;
    
    const avgSlaPerformance = zones.reduce((sum, z) => sum + z.performance.slaCompliancePercent, 0);
    const avgSlaPerformancePercent = activeZones > 0 ? Math.round(avgSlaPerformance / activeZones * 10) / 10 : 0;

    // Utilization
    const avgUtilization = zones.reduce((sum, z) => sum + z.performance.utilizationPercent, 0);
    const avgZoneUtilization = activeZones > 0 ? Math.round(avgUtilization / activeZones * 10) / 10 : 0;

    // Enterprise clients
    const zonesWithEnterpriseClients = zones.filter(z => z.enterpriseClients && z.enterpriseClients.length > 0).length;

    // SLA compliance
    const slaThreshold = 90; // 90% SLA compliance threshold
    const zonesMeetingSla = zones.filter(z => z.performance.slaCompliancePercent >= slaThreshold).length;
    const zonesMissingSla = activeZones - zonesMeetingSla;

    return {
      citiesCovered,
      activeZones,
      agentsAssigned,
      lowCoverageZones,
      avgPickupsPerZone,
      avgSlaPerformancePercent,
      totalZones,
      inactiveZones,
      pendingZones,
      archivedZones,
      totalAgents,
      avgAgentsPerZone,
      highCoverageZones,
      mediumCoverageZones,
      criticalCoverageZones,
      totalDailyPickups,
      totalDailyDropoffs,
      avgZoneUtilization,
      zonesWithEnterpriseClients,
      zonesMeetingSla,
      zonesMissingSla,
    };
  }
}
