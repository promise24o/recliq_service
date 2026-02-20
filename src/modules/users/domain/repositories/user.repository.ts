import { User, UserFilter, UserPaginationResult, UserSummary, UserDetail, UserActionRequest } from '../types/user.types';

export interface IUserRepository {
  // Basic CRUD operations
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  
  // User listing and filtering
  findAll(filter: UserFilter): Promise<UserPaginationResult>;
  findActiveUsers(): Promise<User[]>;
  findDormantUsers(): Promise<User[]>;
  findSuspendedUsers(): Promise<User[]>;
  
  // User statistics
  getUserSummary(): Promise<UserSummary>;
  getUserStats(userId: string): Promise<UserDetail>;
  
  // User actions
  suspendUser(userId: string, reason?: string, notes?: string): Promise<User>;
  reactivateUser(userId: string, reason?: string, notes?: string): Promise<User>;
  flagUser(userId: string, reason?: string, notes?: string): Promise<User>;
  
  // Search functionality
  searchUsers(query: string, filter?: Partial<UserFilter>): Promise<UserPaginationResult>;
  
  // Export functionality
  exportUsers(filter: UserFilter): Promise<User[]>;
  
  // User activity tracking
  updateLastActivity(userId: string): Promise<void>;
  incrementUserStats(userId: string, stats: Partial<Pick<User, 'totalRecycles' | 'cancellations' | 'disputesRaised'>>): Promise<void>;
  
  // User status management
  updateUserStatus(userId: string, status: User['status']): Promise<User>;
  updateUserType(userId: string, type: User['type']): Promise<User>;
  
  // Wallet and financial operations (read-only for admin)
  getUserWalletSnapshot(userId: string): Promise<Pick<User, 'walletBalance' | 'pendingEscrow'>>;
  
  // Zone and city operations
  getUsersByCity(city: string): Promise<User[]>;
  getUsersByZone(zone: string): Promise<User[]>;
  getCitiesWithUsers(): Promise<string[]>;
  getZonesWithUsers(): Promise<string[]>;
  
  // Date-based queries
  getUsersCreatedBetween(startDate: Date, endDate: Date): Promise<User[]>;
  getUsersWithActivityBetween(startDate: Date, endDate: Date): Promise<User[]>;
  
  // Bulk operations
  bulkUpdateStatus(userIds: string[], status: User['status']): Promise<void>;
  bulkSuspendUsers(userIds: string[], reason?: string): Promise<void>;
}
