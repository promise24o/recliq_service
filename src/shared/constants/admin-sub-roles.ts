/**
 * Admin Sub-Role definitions for role-based access control
 */

export enum AdminSubRole {
  OPS_ADMIN = 'OPS_ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN', 
  STRATEGY_ADMIN = 'STRATEGY_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface AdminPermissions {
  canAccessDashboard: boolean;
  canAccessUsers: boolean;
  canAccessAgents: boolean;
  canAccessPickups: boolean;
  canAccessFinance: boolean;
  canAccessWallets: boolean;
  canAccessWithdrawals: boolean;
  canAccessPerformance: boolean;
  canAccessAnalytics: boolean;
  canAccessAll: boolean;
}

export const ADMIN_PERMISSIONS: Record<AdminSubRole, AdminPermissions> = {
  [AdminSubRole.OPS_ADMIN]: {
    canAccessDashboard: true,
    canAccessUsers: true,
    canAccessAgents: true,
    canAccessPickups: true,
    canAccessFinance: false,
    canAccessWallets: false,
    canAccessWithdrawals: false,
    canAccessPerformance: false,
    canAccessAnalytics: false,
    canAccessAll: false,
  },
  [AdminSubRole.FINANCE_ADMIN]: {
    canAccessDashboard: false,
    canAccessUsers: false,
    canAccessAgents: false,
    canAccessPickups: false,
    canAccessFinance: true,
    canAccessWallets: true,
    canAccessWithdrawals: true,
    canAccessPerformance: false,
    canAccessAnalytics: false,
    canAccessAll: false,
  },
  [AdminSubRole.STRATEGY_ADMIN]: {
    canAccessDashboard: false,
    canAccessUsers: false,
    canAccessAgents: false,
    canAccessPickups: false,
    canAccessFinance: false,
    canAccessWallets: false,
    canAccessWithdrawals: false,
    canAccessPerformance: true,
    canAccessAnalytics: true,
    canAccessAll: false,
  },
  [AdminSubRole.SUPER_ADMIN]: {
    canAccessDashboard: true,
    canAccessUsers: true,
    canAccessAgents: true,
    canAccessPickups: true,
    canAccessFinance: true,
    canAccessWallets: true,
    canAccessWithdrawals: true,
    canAccessPerformance: true,
    canAccessAnalytics: true,
    canAccessAll: true,
  },
};

export const ADMIN_SUB_ROLE_DESCRIPTIONS: Record<AdminSubRole, string> = {
  [AdminSubRole.OPS_ADMIN]: 'Operations Admin - Access to Dashboard, Users, Agents, and Pickups',
  [AdminSubRole.FINANCE_ADMIN]: 'Finance Admin - Access to Finance, Wallets, and Withdrawals',
  [AdminSubRole.STRATEGY_ADMIN]: 'Strategy Admin - Access to Performance & Insights, and Analytics',
  [AdminSubRole.SUPER_ADMIN]: 'Super Admin - Full access to all system features',
};
