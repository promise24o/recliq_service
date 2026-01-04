import { Injectable, Inject } from '@nestjs/common';
import type { IBadgeRepository, IUserBadgeRepository } from '../../domain/repositories/reward.repository';
import { Badge, UserBadge } from '../../domain/entities/badge.entity';

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earnedAt?: string;
  isEarned: boolean;
}

export interface BadgesResponse {
  totalBadges: number;
  earnedBadges: BadgeItem[];
  lockedBadges: BadgeItem[];
}

@Injectable()
export class GetBadgesUseCase {
  constructor(
    @Inject('IBadgeRepository')
    private readonly badgeRepository: IBadgeRepository,
    @Inject('IUserBadgeRepository')
    private readonly userBadgeRepository: IUserBadgeRepository,
  ) {}

  async execute(userId: string): Promise<BadgesResponse> {
    // Get all active badges
    const allBadges = await this.badgeRepository.findActive();
    
    // Get user's earned badges
    const userBadges = await this.userBadgeRepository.findByUserId(userId);
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    // Separate earned and locked badges
    const earnedBadges: BadgeItem[] = [];
    const lockedBadges: BadgeItem[] = [];

    for (const badge of allBadges) {
      const userBadge = userBadges.find(ub => ub.badgeId === badge.badgeId);
      
      const badgeItem: BadgeItem = {
        id: badge.badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        criteria: this.formatCriteria(badge.criteria),
        earnedAt: userBadge?.earnedAt?.toISOString(),
        isEarned: earnedBadgeIds.has(badge.badgeId),
      };

      if (badgeItem.isEarned) {
        earnedBadges.push(badgeItem);
      } else {
        lockedBadges.push(badgeItem);
      }
    }

    return {
      totalBadges: allBadges.length,
      earnedBadges,
      lockedBadges,
    };
  }

  private formatCriteria(criteria: any): string {
    switch (criteria.type) {
      case 'FIRST_RECYCLE':
        return 'Complete your first recycling pickup';
      case 'WEIGHT_THRESHOLD':
        return `Recycle ${criteria.value}kg total`;
      case 'PICKUP_COUNT':
        return `Complete ${criteria.value} pickups`;
      case 'STREAK_WEEKS':
        return `Maintain a ${criteria.value}-week streak`;
      case 'REFERRAL_COUNT':
        return `Refer ${criteria.value} friends`;
      default:
        return 'Complete the required actions';
    }
  }
}
