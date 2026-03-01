import { ServiceRadiusDocument } from '../../infrastructure/persistence/service-radius.model';

export interface IServiceRadiusRepository {
  findByUserId(userId: string): Promise<ServiceRadiusDocument | null>;
  create(userId: string, data: Partial<ServiceRadiusDocument>): Promise<ServiceRadiusDocument>;
  update(userId: string, data: Partial<ServiceRadiusDocument>): Promise<ServiceRadiusDocument>;
  delete(userId: string): Promise<void>;
  findAgentsInRadius(location: { latitude: number; longitude: number }, radiusKm: number): Promise<ServiceRadiusDocument[]>;
  findAgentsByZoneId(zoneId: string): Promise<ServiceRadiusDocument[]>;
}
