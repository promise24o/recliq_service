export enum RiskState {
  ACTIVE = 'active',
  FLAGGED = 'flagged',
  TEMPORARILY_SUSPENDED = 'temporarily_suspended',
  PERMANENTLY_BANNED = 'permanently_banned',
  COMPLIANCE_HOLD = 'compliance_hold'
}

export enum RiskEventType {
  FLAG = 'flag',
  SUSPEND = 'suspend',
  REINSTATE = 'reinstate',
  BAN = 'ban'
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface RiskEvent {
  id: string;
  userId: string;
  type: RiskEventType;
  reason: string;
  timestamp: Date;
  actor: string;
  actorId: string;
  expires?: Date;
  resolved?: boolean;
  metadata?: Record<string, any>;
}

export interface ActivityContext {
  disputes: number;
  cancellations: number;
  walletAnomalies: boolean;
  pickupHistory: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
  };
}

export interface RiskUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  zone: string;
  riskState: RiskState;
  reason: string;
  since: Date;
  expires?: Date;
  flaggedBy: string;
  flaggedById: string;
  lastActivity: Date;
  accountAge: string;
  kycStatus: KYCStatus;
  riskTimeline: RiskEvent[];
  activityContext: ActivityContext;
  userDetails: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    type: string;
    role: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    isVerified: boolean;
    profilePhoto?: string;
    totalRecycles: number;
    lastActivity: Date;
    created: Date;
  };
}

export interface RiskSummary {
  permanentlyBanned: number;
  temporarilySuspended: number;
  flaggedUsers: number;
  complianceHolds: number;
  usersUnderReview: number;
  reinstated30d: number;
}

export interface CreateRiskEventDto {
  userId: string;
  type: RiskEventType;
  reason: string;
  duration?: number; // in days for suspension
  metadata?: Record<string, any>;
}

export interface GetRiskUsersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  riskState?: RiskState;
  reason?: string;
  sortBy?: 'name' | 'since' | 'lastActivity' | 'riskState';
  sortOrder?: 'asc' | 'desc';
}

export interface RiskUsersResponseDto {
  data: RiskUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RiskActionDto {
  action: 'flag' | 'suspend' | 'reinstate' | 'extend_suspension' | 'ban';
  reason: string;
  duration?: number; // in days for suspension/extension
  metadata?: Record<string, any>;
}
