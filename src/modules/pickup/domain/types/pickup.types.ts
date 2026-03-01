export type PickupMode = 'pickup' | 'dropoff';
export type MatchType = 'auto' | 'user_selected';
export type WasteType = 'plastic' | 'paper' | 'metal' | 'glass' | 'organic' | 'e_waste' | 'mixed';
export type PickupStatus = 'new' | 'matching' | 'pending_acceptance' | 'assigned' | 'agent_en_route' | 'arrived' | 'completed' | 'cancelled' | 'failed';
export type MatchingEventType = 'matching_started' | 'agent_notified' | 'agent_accepted' | 'agent_rejected' | 'agent_declined' | 'reassigned' | 'timeout' | 'user_cancelled';
export type FailureReason = 'no_available_agent' | 'agent_rejection' | 'timeout' | 'user_cancellation';
export type DelayCause = 'supply_shortage' | 'distance' | 'peak_hour_congestion' | 'agent_flakiness';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PickupPricing {
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  currency: string;
}

export interface MatchingEvent {
  id: string;
  type: MatchingEventType;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  details: string;
}

export interface PickupRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  city: string;
  zone: string;
  pickupMode: PickupMode;
  matchType: MatchType;
  wasteType: WasteType;
  estimatedWeight: number;
  actualWeight?: number;
  status: PickupStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  slaDeadline: string;
  pricing: PickupPricing;
  coordinates: Coordinates;
  address: string;
  notes?: string;
  matchingTimeline: MatchingEvent[];
  failureReason?: string;
  delayReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  escalatedTo?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickupRequestSummary {
  newRequests: number;
  matchingInProgress: number;
  assignedPickups: number;
  dropoffRequests: number;
  atRiskSLA: number;
  failedRequests: number;
  completedToday: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  breakdown: {
    pickup: number;
    dropoff: number;
    auto: number;
    userSelected: number;
  };
}

export interface FailureAnalysis {
  totalFailures: number;
  failureReasons: {
    noAvailableAgent: number;
    agentRejection: number;
    timeout: number;
    userCancellation: number;
  };
  delayCauses: {
    supplyShortage: number;
    distance: number;
    peakHourCongestion: number;
    agentFlakiness: number;
  };
  cityBreakdown: Record<string, {
    failures: number;
    delays: number;
    totalRequests: number;
  }>;
}

export interface PickupFilters {
  city?: string;
  zone?: string;
  pickupMode?: PickupMode;
  matchType?: MatchType;
  wasteType?: WasteType;
  status?: PickupStatus;
  search?: string;
  timeRange?: 'today' | 'yesterday' | 'week' | 'month';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
