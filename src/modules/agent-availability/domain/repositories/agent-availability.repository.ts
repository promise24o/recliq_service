import type { AgentAvailabilityDocument } from '../../infrastructure/persistence/agent-availability.model';

export interface IAgentAvailabilityRepository {
  findByUserId(userId: string): Promise<AgentAvailabilityDocument | null>;
  create(userId: string, data: any): Promise<AgentAvailabilityDocument>;
  update(userId: string, data: any): Promise<AgentAvailabilityDocument>;
  updateOnlineStatus(userId: string, isOnline: boolean): Promise<AgentAvailabilityDocument>;
  updateLocation(userId: string, lat: number, lng: number): Promise<AgentAvailabilityDocument>;
  findOnlineAgentsByZone(city: string, zone: string): Promise<AgentAvailabilityDocument[]>;
  delete(userId: string): Promise<void>;
}
