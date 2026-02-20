import { Injectable, Inject } from '@nestjs/common';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';

export interface ZoneInsight {
  zoneId: string;
  zoneName: string;
  city: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  value: number;
  recommendation: string;
}

@Injectable()
export class GetZoneInsightsUseCase {
  constructor(
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(): Promise<ZoneInsight[]> {
    const zones = await this.zoneRepository.findAll();
    const insights: ZoneInsight[] = [];

    for (const zone of zones) {
      // Skip archived zones
      if (zone.status === 'archived') continue;

      // Utilization insights
      if (zone.performance.utilizationPercent >= 90) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'critical',
          metric: 'Utilization',
          value: zone.performance.utilizationPercent,
          recommendation: 'Zone is overutilized - consider splitting or adding more agents',
        });
      } else if (zone.performance.utilizationPercent >= 75) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'warning',
          metric: 'Utilization',
          value: zone.performance.utilizationPercent,
          recommendation: 'High utilization detected - monitor capacity and consider resource allocation',
        });
      }

      // Coverage Gap insights
      if (zone.coverageGapPercent >= 80) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'critical',
          metric: 'Coverage Gap',
          value: zone.coverageGapPercent,
          recommendation: 'Critical coverage gap - immediate action required to improve service coverage',
        });
      } else if (zone.coverageGapPercent >= 60) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'warning',
          metric: 'Coverage Gap',
          value: zone.coverageGapPercent,
          recommendation: 'Significant coverage gap - optimize pickup routes or expand zone boundaries',
        });
      }

      // SLA Performance insights
      if (zone.performance.slaCompliancePercent < 70) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'critical',
          metric: 'SLA Performance',
          value: zone.performance.slaCompliancePercent,
          recommendation: 'SLA performance critically low - review operational processes immediately',
        });
      } else if (zone.performance.slaCompliancePercent < 85) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'warning',
          metric: 'SLA Performance',
          value: zone.performance.slaCompliancePercent,
          recommendation: 'SLA performance below target - investigate bottlenecks and optimize workflows',
        });
      }

      // Agent availability insights
      if (zone.totalAgents > 0) {
        const agentUtilization = ((zone.totalAgents - zone.activeAgents) / zone.totalAgents) * 100;
        if (agentUtilization >= 50) {
          insights.push({
            zoneId: zone.id,
            zoneName: zone.name,
            city: zone.city,
            severity: 'warning',
            metric: 'Agent Availability',
            value: agentUtilization,
            recommendation: 'High number of inactive agents - review agent scheduling and availability',
          });
        }
      }

      // Demand intensity vs capacity insights
      if (zone.demandIntensity === 'high' && zone.coverageLevel !== 'high') {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'warning',
          metric: 'Demand-Capacity Gap',
          value: 75, // Placeholder value
          recommendation: 'High demand with insufficient coverage level - consider upgrading coverage or adding resources',
        });
      }

      // Performance insights for well-performing zones
      if (zone.performance.slaCompliancePercent >= 95 && 
          zone.performance.utilizationPercent >= 60 && 
          zone.performance.utilizationPercent <= 80 &&
          zone.coverageGapPercent <= 30) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'info',
          metric: 'Daily Pickups',
          value: zone.avgPickupsPerDay,
          recommendation: 'Zone performing excellently - consider expansion opportunities or best practice sharing',
        });
      }

      // Low activity zones
      if (zone.avgPickupsPerDay < 5 && zone.status === 'active') {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'info',
          metric: 'Activity Level',
          value: zone.avgPickupsPerDay,
          recommendation: 'Low pickup activity - review marketing efforts or zone boundaries',
        });
      }

      // Large zones that might need splitting
      if (zone.boundary.areaKm2 > 50 && zone.performance.utilizationPercent > 70) {
        insights.push({
          zoneId: zone.id,
          zoneName: zone.name,
          city: zone.city,
          severity: 'warning',
          metric: 'Zone Size',
          value: zone.boundary.areaKm2,
          recommendation: 'Large zone with high utilization - consider splitting for better coverage',
        });
      }
    }

    // Sort insights by severity (critical first) and then by value
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    insights.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.value - a.value; // Higher values first within same severity
    });

    return insights.slice(0, 20); // Limit to top 20 insights
  }
}
