import { Zone, ZoneSummary, ZoneChangeEvent, ZoneExpansionInsight } from '../types/zone.types';

export interface IZoneRepository {
  // Zone CRUD operations
  create(zone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone>;
  findById(id: string): Promise<Zone | null>;
  findAll(filters?: {
    city?: string;
    state?: string;
    status?: string;
    coverageLevel?: string;
  }): Promise<Zone[]>;
  findByCity(city: string): Promise<Zone[]>;
  findByNameAndCity(name: string, city: string): Promise<Zone | null>;
  update(id: string, updates: Partial<Zone>): Promise<Zone>;
  delete(id: string): Promise<void>;
  
  // Zone analytics
  getSummary(): Promise<ZoneSummary>;
  getChangeHistory(zoneId?: string): Promise<ZoneChangeEvent[]>;
  getExpansionInsights(): Promise<ZoneExpansionInsight[]>;
  
  // Zone performance
  updatePerformance(id: string, performance: Partial<Zone['performance']>): Promise<void>;
  
  // Zone statistics
  getZoneStats(zoneId: string): Promise<{
    totalPickups: number;
    totalDropoffs: number;
    agentUtilization: number;
    slaCompliance: number;
  }>;
}
