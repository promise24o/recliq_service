import { Injectable, Inject } from '@nestjs/common';
import { RISK_REPOSITORY_TOKEN } from '../../domain/repositories/risk.repository.token';
import type { IRiskRepository } from '../../domain/repositories/risk.repository';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { WALLET_REPOSITORY_TOKEN } from '../../../wallet/domain/repositories/wallet.repository.token';
import type { IWalletRepository } from '../../../wallet/domain/repositories/wallet.repository';
import { UserFilter } from '../../../users/domain/types/user.types';
import { 
  RiskUser, 
  RiskSummary, 
  RiskEvent, 
  RiskState, 
  RiskEventType,
  ActivityContext,
  GetRiskUsersQueryDto,
  RiskUsersResponseDto,
  CreateRiskEventDto,
  RiskActionDto
} from '../../domain/types/risk.types';

@Injectable()
export class RiskManagementUseCase {
  constructor(
    @Inject(RISK_REPOSITORY_TOKEN) private readonly riskRepository: IRiskRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject(WALLET_REPOSITORY_TOKEN) private readonly walletRepository: IWalletRepository,
  ) {}

  async getRiskUsers(query: GetRiskUsersQueryDto): Promise<RiskUsersResponseDto> {
    const { page = 1, limit = 25, search, city, riskState, reason, sortBy = 'since', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Get all users first with empty filter to get all users
    const filter: UserFilter = {};
    const allUsersResult = await this.userRepository.findAll(filter);
    const allUsers = allUsersResult.users;
    
    // Get risk events for all users
    const usersWithRisk = await Promise.all(
      allUsers.map(async (user) => {
        const riskEvents = await this.riskRepository.getRiskEventsByUserId(user.id);
        const currentRiskState = this.determineCurrentRiskState(riskEvents);
        
        // Skip if not a risk user and no filters applied
        if (currentRiskState === RiskState.ACTIVE && !riskState) {
          return null;
        }

        // Apply filters
        if (city && user.city !== city) return null;
        if (riskState && currentRiskState !== riskState) return null;
        if (reason && !riskEvents.some(event => event.reason.toLowerCase().includes(reason.toLowerCase()))) {
          return null;
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          if (!user.name.toLowerCase().includes(searchLower) &&
              !user.phone.includes(search) &&
              !user.id.toLowerCase().includes(searchLower)) {
            return null;
          }
        }

        const activityContext = await this.calculateActivityContext(user.id);
        const currentRiskEvent = this.getCurrentRiskEvent(riskEvents);

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          city: user.city,
          zone: user.zone,
          riskState: currentRiskState,
          reason: currentRiskEvent?.reason || 'No active risk',
          since: currentRiskEvent?.timestamp || new Date(),
          expires: currentRiskEvent?.expires,
          flaggedBy: currentRiskEvent?.actor || 'System',
          flaggedById: currentRiskEvent?.actorId || 'system',
          lastActivity: user.lastActivity,
          accountAge: this.calculateAccountAge(user.created),
          kycStatus: this.mapKycStatus(user.type, user.isVerified),
          riskTimeline: riskEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
          activityContext,
          userDetails: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            type: user.type,
            role: user.role,
            location: user.location,
            isVerified: user.isVerified,
            profilePhoto: user.profilePhoto,
            totalRecycles: user.totalRecycles,
            lastActivity: user.lastActivity,
            created: user.created
          }
        } as RiskUser;
      })
    );

    // Filter out null values and sort
    let filteredUsers = usersWithRisk.filter((user): user is RiskUser => user !== null);
    
    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'since':
          aValue = a.since.getTime();
          bValue = b.since.getTime();
          break;
        case 'lastActivity':
          aValue = a.lastActivity.getTime();
          bValue = b.lastActivity.getTime();
          break;
        case 'riskState':
          aValue = a.riskState;
          bValue = b.riskState;
          break;
        default:
          aValue = a.since.getTime();
          bValue = b.since.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    return {
      data: paginatedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRiskSummary(): Promise<RiskSummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allRiskEvents = await this.riskRepository.getAllRiskEvents();
    const userRiskStates = new Map<string, RiskState>();

    // Calculate current risk state for each user
    allRiskEvents.forEach(event => {
      const currentState = userRiskStates.get(event.userId) || RiskState.ACTIVE;
      const newState = this.calculateRiskStateAfterEvent(currentState, event);
      userRiskStates.set(event.userId, newState);
    });

    const summary: RiskSummary = {
      permanentlyBanned: 0,
      temporarilySuspended: 0,
      flaggedUsers: 0,
      complianceHolds: 0,
      usersUnderReview: 0,
      reinstated30d: 0,
    };

    userRiskStates.forEach(state => {
      switch (state) {
        case RiskState.PERMANENTLY_BANNED:
          summary.permanentlyBanned++;
          break;
        case RiskState.TEMPORARILY_SUSPENDED:
          summary.temporarilySuspended++;
          break;
        case RiskState.FLAGGED:
          summary.flaggedUsers++;
          break;
        case RiskState.COMPLIANCE_HOLD:
          summary.complianceHolds++;
          break;
        case RiskState.ACTIVE:
          summary.usersUnderReview++;
          break;
      }
    });

    // Count reinstated users in last 30 days
    const reinstatedEvents = allRiskEvents.filter(event => 
      event.type === RiskEventType.REINSTATE && 
      event.timestamp >= thirtyDaysAgo
    );
    summary.reinstated30d = new Set(reinstatedEvents.map(e => e.userId)).size;

    return summary;
  }

  async createRiskEvent(createRiskEventDto: CreateRiskEventDto, actorId: string, actorName: string): Promise<RiskEvent> {
    const { userId, type, reason, duration, metadata } = createRiskEventDto;

    // Get user details
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get current risk state
    const existingEvents = await this.riskRepository.getRiskEventsByUserId(userId);
    const currentRiskState = this.determineCurrentRiskState(existingEvents);

    // Validate action based on current state
    this.validateRiskAction(currentRiskState, type);

    // Create risk event
    const riskEvent: RiskEvent = {
      id: `RISK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      reason,
      timestamp: new Date(),
      actor: actorName,
      actorId,
      metadata,
    };

    // Add expiration for suspensions
    if ((type === RiskEventType.SUSPEND || type === RiskEventType.FLAG) && duration) {
      riskEvent.expires = new Date();
      riskEvent.expires.setDate(riskEvent.expires.getDate() + duration);
    }

    // Save risk event
    await this.riskRepository.createRiskEvent(riskEvent);

    // Update user status if needed
    await this.updateUserRiskStatus(userId, type);

    return riskEvent;
  }

  async executeRiskAction(userId: string, actionDto: RiskActionDto, actorId: string, actorName: string): Promise<RiskEvent> {
    const { action, reason, duration, metadata } = actionDto;

    const createRiskEventDto: CreateRiskEventDto = {
      userId,
      type: this.mapActionToEventType(action),
      reason,
      duration,
      metadata: {
        ...metadata,
        actionType: action,
      }
    };

    return this.createRiskEvent(createRiskEventDto, actorId, actorName);
  }

  async getRiskUserById(userId: string): Promise<RiskUser | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    const riskEvents = await this.riskRepository.getRiskEventsByUserId(userId);
    const currentRiskState = this.determineCurrentRiskState(riskEvents);
    const activityContext = await this.calculateActivityContext(userId);
    const currentRiskEvent = this.getCurrentRiskEvent(riskEvents);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      city: user.city,
      zone: user.zone,
      riskState: currentRiskState,
      reason: currentRiskEvent?.reason || 'No active risk',
      since: currentRiskEvent?.timestamp || new Date(),
      expires: currentRiskEvent?.expires,
      flaggedBy: currentRiskEvent?.actor || 'System',
      flaggedById: currentRiskEvent?.actorId || 'system',
      lastActivity: user.lastActivity,
      accountAge: this.calculateAccountAge(user.created),
      kycStatus: this.mapKycStatus(user.type, user.isVerified),
      riskTimeline: riskEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      activityContext,
      userDetails: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        type: user.type,
        role: user.role,
        location: user.location,
        isVerified: user.isVerified,
        profilePhoto: user.profilePhoto,
        totalRecycles: user.totalRecycles,
        lastActivity: user.lastActivity,
        created: user.created
      }
    };
  }

  private determineCurrentRiskState(riskEvents: RiskEvent[]): RiskState {
    if (riskEvents.length === 0) return RiskState.ACTIVE;

    // Sort by timestamp (most recent first)
    const sortedEvents = riskEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Find the most recent active event
    for (const event of sortedEvents) {
      // Check if event has expired
      if (event.expires && event.expires < new Date()) {
        continue;
      }

      // Check if event was resolved
      if (event.resolved) {
        continue;
      }

      // Map event type to risk state
      switch (event.type) {
        case RiskEventType.BAN:
          return RiskState.PERMANENTLY_BANNED;
        case RiskEventType.SUSPEND:
          return RiskState.TEMPORARILY_SUSPENDED;
        case RiskEventType.FLAG:
          return RiskState.FLAGGED;
        case RiskEventType.REINSTATE:
          return RiskState.ACTIVE;
      }
    }

    return RiskState.ACTIVE;
  }

  private calculateRiskStateAfterEvent(currentState: RiskState, event: RiskEvent): RiskState {
    switch (event.type) {
      case RiskEventType.BAN:
        return RiskState.PERMANENTLY_BANNED;
      case RiskEventType.SUSPEND:
        return RiskState.TEMPORARILY_SUSPENDED;
      case RiskEventType.FLAG:
        return RiskState.FLAGGED;
      case RiskEventType.REINSTATE:
        return RiskState.ACTIVE;
      default:
        return currentState;
    }
  }

  private validateRiskAction(currentState: RiskState, action: RiskEventType): void {
    const validTransitions: Record<RiskState, RiskEventType[]> = {
      [RiskState.ACTIVE]: [RiskEventType.FLAG, RiskEventType.SUSPEND, RiskEventType.BAN],
      [RiskState.FLAGGED]: [RiskEventType.SUSPEND, RiskEventType.BAN, RiskEventType.REINSTATE],
      [RiskState.TEMPORARILY_SUSPENDED]: [RiskEventType.BAN, RiskEventType.REINSTATE],
      [RiskState.PERMANENTLY_BANNED]: [RiskEventType.REINSTATE], // Allow appeal/reinstatement
      [RiskState.COMPLIANCE_HOLD]: [RiskEventType.SUSPEND, RiskEventType.BAN, RiskEventType.REINSTATE],
    };

    if (!validTransitions[currentState].includes(action)) {
      throw new Error(`Invalid action ${action} for current state ${currentState}`);
    }
  }

  private mapActionToEventType(action: string): RiskEventType {
    const actionMap: Record<string, RiskEventType> = {
      'flag': RiskEventType.FLAG,
      'suspend': RiskEventType.SUSPEND,
      'reinstate': RiskEventType.REINSTATE,
      'ban': RiskEventType.BAN,
      'extend_suspension': RiskEventType.SUSPEND,
    };

    return actionMap[action] || RiskEventType.FLAG;
  }

  private async calculateActivityContext(userId: string): Promise<ActivityContext> {
    // This would typically integrate with other services
    // For now, return mock data that would be calculated from:
    // - Dispute service
    // - Pickup/cancellation service
    // - Wallet transaction analysis
    
    return {
      disputes: 0,
      cancellations: 0,
      walletAnomalies: false,
      pickupHistory: {
        total: 0,
        completed: 0,
        cancelled: 0,
        noShows: 0,
      },
    };
  }

  private getCurrentRiskEvent(riskEvents: RiskEvent[]): RiskEvent | null {
    const sortedEvents = riskEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    for (const event of sortedEvents) {
      if (event.expires && event.expires < new Date()) continue;
      if (event.resolved) continue;
      return event;
    }
    
    return null;
  }

  private calculateAccountAge(created: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  private mapKycStatus(userType: string, isVerified: boolean): any {
    // This would map to your actual KYC status enum
    return isVerified ? 'approved' : 'not_started';
  }

  private async updateUserRiskStatus(userId: string, eventType: RiskEventType): Promise<void> {
    // This would update the user's status in the user repository
    // based on the risk event type
    // Implementation depends on your user management system
  }
}
