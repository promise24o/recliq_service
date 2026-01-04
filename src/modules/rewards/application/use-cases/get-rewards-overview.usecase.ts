import { Injectable, Inject } from '@nestjs/common';
import type { IRewardPointsRepository } from '../../domain/repositories/reward.repository';
import { RewardPoints } from '../../domain/entities/reward-points.entity';

export interface RewardsOverviewResponse {
  totalPoints: number;
  level: {
    number: number;
    name: string;
  };
  pointsToNextLevel: number;
  levelProgressPercent: number;
}

@Injectable()
export class GetRewardsOverviewUseCase {
  constructor(
    @Inject('IRewardPointsRepository')
    private readonly rewardPointsRepository: IRewardPointsRepository,
  ) {}

  async execute(userId: string): Promise<RewardsOverviewResponse> {
    let rewardPoints = await this.rewardPointsRepository.findByUserId(userId);
    
    // Create if doesn't exist
    if (!rewardPoints) {
      rewardPoints = await this.rewardPointsRepository.create(userId);
    }

    return {
      totalPoints: rewardPoints.totalPoints,
      level: {
        number: rewardPoints.currentLevel,
        name: rewardPoints.getLevelName(),
      },
      pointsToNextLevel: rewardPoints.pointsToNextLevel,
      levelProgressPercent: rewardPoints.getLevelProgressPercent(),
    };
  }
}
