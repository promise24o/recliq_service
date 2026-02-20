import { City } from '../types/zone.types';

export interface ICityRepository {
  // City CRUD operations
  create(city: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City>;
  findById(id: string): Promise<City | null>;
  findByName(name: string): Promise<City | null>;
  findAll(filters?: {
    state?: string;
    isActive?: boolean;
  }): Promise<City[]>;
  update(id: string, updates: Partial<City>): Promise<City>;
  delete(id: string): Promise<void>;
  
  // City statistics
  getCityStats(cityId: string): Promise<{
    totalZones: number;
    activeZones: number;
    totalAgents: number;
    avgCoverage: number;
  }>;
  
  // Get all cities with their zones count
  getCitiesWithZoneCount(): Promise<Array<City & { zoneCount: number }>>;
}
