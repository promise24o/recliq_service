import { UserRole } from "@/shared/constants/roles";

export enum UserStatus {
  ACTIVE = 'active',
  DORMANT = 'dormant',
  CHURNED = 'churned',
  SUSPENDED = 'suspended'
}

export enum UserType {
  INDIVIDUAL = 'individual',
  ENTERPRISE = 'enterprise',
  AGENT = 'agent'
}

export enum UserAction {
  SUSPEND = 'suspend',
  REACTIVATE = 'reactivate',
  FLAG = 'flag'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  zone: string;
  status: UserStatus;
  type: UserType;
  role: UserRole;
  totalRecycles: number;
  lastActivity: Date;
  created: Date;
  walletBalance: number;
  pendingEscrow: number;
  disputesRaised: number;
  cancellations: number;
  avgResponseTime: number;
  profilePhoto?: string;
  isVerified: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  dormantUsers: number;
  churnedUsers: number;
  suspendedUsers: number;
}

export interface UserFilter {
  search?: string;
  city?: string;
  zone?: string;
  status?: UserStatus;
  type?: UserType;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
}

export interface UserActionRequest {
  action: UserAction;
  reason?: string;
  notes?: string;
}

export interface UserPaginationResult {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserActivityStats {
  totalPickups: number;
  completedPickups: number;
  cancelledPickups: number;
  avgResponseTime: number;
  lastActivityDate: Date;
}

export interface UserWalletSnapshot {
  balance: number;
  pendingEscrow: number;
  lifetimeRewards: number;
  totalEarnings: number;
}

export interface UserRiskSignals {
  disputesRaised: number;
  cancellations: number;
  trustScore: 'high' | 'medium' | 'low';
  riskFlags: string[];
}

export interface UserDetail extends User {
  activityStats: UserActivityStats;
  walletSnapshot: UserWalletSnapshot;
  riskSignals: UserRiskSignals;
}
