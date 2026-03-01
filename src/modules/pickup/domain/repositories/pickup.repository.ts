import { PickupRequest, PickupRequestSummary, FunnelStage, FailureAnalysis, PickupFilters, PaginatedResult, MatchingEvent } from '../types/pickup.types';

export interface IPickupRepository {
  create(pickup: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PickupRequest>;
  findById(id: string): Promise<PickupRequest | null>;
  findAll(filters: PickupFilters): Promise<PaginatedResult<PickupRequest>>;
  findByUserId(userId: string): Promise<PickupRequest[]>;
  findByAgentId(agentId: string): Promise<PickupRequest[]>;
  update(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest>;
  updateStatus(id: string, status: string, additionalData?: Partial<PickupRequest>): Promise<PickupRequest>;
  addMatchingEvent(id: string, event: MatchingEvent): Promise<PickupRequest>;
  delete(id: string): Promise<void>;

  getSummary(filters?: { city?: string; timeRange?: string }): Promise<PickupRequestSummary>;
  getFunnelData(filters?: { city?: string; timeRange?: string }): Promise<FunnelStage[]>;
  getFailureAnalysis(filters?: { city?: string; timeRange?: string }): Promise<FailureAnalysis>;

  countByStatus(status: string, filters?: { city?: string; timeRange?: string }): Promise<number>;
  findAtRiskSLA(thresholdMinutes: number): Promise<PickupRequest[]>;
  findActiveByAgentId(agentId: string): Promise<PickupRequest | null>;
}
