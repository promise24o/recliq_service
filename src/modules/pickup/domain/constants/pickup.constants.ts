export enum PickupModeEnum {
  PICKUP = 'pickup',
  DROPOFF = 'dropoff',
}

export enum MatchTypeEnum {
  AUTO = 'auto',
  USER_SELECTED = 'user_selected',
}

export enum WasteTypeEnum {
  PLASTIC = 'plastic',
  PAPER = 'paper',
  METAL = 'metal',
  GLASS = 'glass',
  ORGANIC = 'organic',
  E_WASTE = 'e_waste',
  MIXED = 'mixed',
}

export enum PickupStatusEnum {
  NEW = 'new',
  MATCHING = 'matching',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  ASSIGNED = 'assigned',
  AGENT_EN_ROUTE = 'agent_en_route',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum MatchingEventTypeEnum {
  MATCHING_STARTED = 'matching_started',
  AGENT_NOTIFIED = 'agent_notified',
  AGENT_ACCEPTED = 'agent_accepted',
  AGENT_REJECTED = 'agent_rejected',
  AGENT_DECLINED = 'agent_declined',
  REASSIGNED = 'reassigned',
  TIMEOUT = 'timeout',
  USER_CANCELLED = 'user_cancelled',
}

export enum FailureReasonEnum {
  NO_AVAILABLE_AGENT = 'no_available_agent',
  AGENT_REJECTION = 'agent_rejection',
  TIMEOUT = 'timeout',
  USER_CANCELLATION = 'user_cancellation',
}

export enum DelayCauseEnum {
  SUPPLY_SHORTAGE = 'supply_shortage',
  DISTANCE = 'distance',
  PEAK_HOUR_CONGESTION = 'peak_hour_congestion',
  AGENT_FLAKINESS = 'agent_flakiness',
}

export const SLA_DEADLINE_MINUTES = {
  pickup: 60,
  dropoff: 120,
};

export const DEFAULT_CURRENCY = 'NGN';
