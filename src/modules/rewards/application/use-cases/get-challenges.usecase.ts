import { Injectable, Inject } from '@nestjs/common';
import type { IChallengeRepository, IUserChallengeProgressRepository } from '../../domain/repositories/reward.repository';
import { Challenge, UserChallengeProgress } from '../../domain/entities/challenge.entity';

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  percent: number;
  pointsReward: number;
  daysLeft: number;
  completed: boolean;
  completedAt?: string;
}

export interface ChallengesResponse {
  activeChallenges: ChallengeItem[];
  completedChallenges: ChallengeItem[];
}

@Injectable()
export class GetChallengesUseCase {
  constructor(
    @Inject('IChallengeRepository')
    private readonly challengeRepository: IChallengeRepository,
    @Inject('IUserChallengeProgressRepository')
    private readonly userChallengeProgressRepository: IUserChallengeProgressRepository,
  ) {}

  async execute(userId: string): Promise<ChallengesResponse> {
    // Get all active challenges
    const activeChallenges = await this.challengeRepository.findActive();
    
    // Get user's progress for all challenges
    const userProgress = await this.userChallengeProgressRepository.findByUserId(userId);
    const progressMap = new Map(userProgress.map(p => [p.challengeId, p]));

    const activeChallengeItems: ChallengeItem[] = [];
    const completedChallengeItems: ChallengeItem[] = [];

    for (const challenge of activeChallenges) {
      const progress = progressMap.get(challenge.challengeId);
      
      const challengeItem: ChallengeItem = {
        id: challenge.challengeId,
        title: challenge.title,
        description: challenge.description,
        progress: progress?.currentProgress || 0,
        target: challenge.targetValue,
        percent: challenge.getProgressPercent(progress?.currentProgress || 0),
        pointsReward: challenge.rewardPoints,
        daysLeft: challenge.getDaysRemaining(),
        completed: progress?.completed || false,
        completedAt: progress?.completedAt?.toISOString(),
      };

      if (challengeItem.completed) {
        completedChallengeItems.push(challengeItem);
      } else {
        activeChallengeItems.push(challengeItem);
      }
    }

    return {
      activeChallenges: activeChallengeItems,
      completedChallenges: completedChallengeItems,
    };
  }
}
