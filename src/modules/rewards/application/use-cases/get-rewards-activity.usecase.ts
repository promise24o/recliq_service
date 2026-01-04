import { Injectable, Inject } from '@nestjs/common';
import type { IRewardActivityRepository } from '../../domain/repositories/reward.repository';
import { RewardActivity, RewardActivityType } from '../../domain/entities/reward-activity.entity';

export interface ActivityItem {
  id: string;
  type: RewardActivityType;
  description: string;
  points: number;
  date: string;
}

export interface RewardsActivityResponse {
  activity: ActivityItem[];
  hasMore: boolean;
}

@Injectable()
export class GetRewardsActivityUseCase {
  constructor(
    @Inject('IRewardActivityRepository')
    private readonly rewardActivityRepository: IRewardActivityRepository,
  ) {}

  async execute(userId: string, limit: number = 20, offset: number = 0): Promise<RewardsActivityResponse> {
    const activities = await this.rewardActivityRepository.findByUserId(userId, limit + 1, offset);
    
    const hasMore = activities.length > limit;
    const activity = activities.slice(0, limit).map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      points: activity.points,
      date: activity.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
    }));

    return {
      activity,
      hasMore,
    };
  }
}
