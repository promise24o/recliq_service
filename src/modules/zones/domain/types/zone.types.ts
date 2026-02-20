export type ZoneStatus = 'active' | 'inactive' | 'pending' | 'archived';
export type SLATier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type CoverageLevel = 'high' | 'medium' | 'low' | 'critical';
export type DemandIntensity = 'high' | 'medium' | 'low';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PickupWindow {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ZonePerformance {
  avgPickupTimeMins: number;
  completionRatePercent: number;
  agentIdlePercent: number;
  slaCompliancePercent: number;
  utilizationPercent: number;
}

export interface ZoneBoundary {
  polygon: LatLng[];
  center: LatLng;
  areaKm2: number;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string;
  boundary: ZoneBoundary;
  status: ZoneStatus;
  coverageLevel: CoverageLevel;
  activeAgents: number;
  totalAgents: number;
  pricingRuleId: string;
  pricingRuleName: string;
  slaTier: SLATier;
  pickupAvailability: PickupWindow[];
  dropoffEligible: boolean;
  avgPickupsPerDay: number;
  avgDropoffsPerDay: number;
  demandIntensity: DemandIntensity;
  coverageGapPercent: number;
  enterpriseClients: string[];
  contractOverrides: number;
  performance: ZonePerformance;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastChangedBy?: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  center: LatLng;
  isActive: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastChangedBy?: string;
}

export interface ZoneSummary {
  citiesCovered: number;
  activeZones: number;
  agentsAssigned: number;
  lowCoverageZones: number;
  avgPickupsPerZone: number;
  avgSlaPerformancePercent: number;
}

export interface ZoneChangeEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'boundary_changed';
  zoneId: string;
  zoneName: string;
  description: string;
  changes?: Array<{
    field: string;
    before: string;
    after: string;
  }>;
}

export interface ZoneExpansionInsight {
  zoneId: string;
  zoneName: string;
  city: string;
  metric: string;
  value: number;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}
