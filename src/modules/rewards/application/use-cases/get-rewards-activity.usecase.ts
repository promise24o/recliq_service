import { Injectable, Inject } from '@nestjs/common';
import type { IRewardLedgerRepository } from '../../domain/repositories/reward.repository';
import { RewardLedger, RewardType } from '../../domain/entities/reward-ledger.entity';

export interface ActivityItem {
  id: string;
  type: RewardType;
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
    @Inject('IRewardLedgerRepository')
    private readonly rewardLedgerRepository: IRewardLedgerRepository,
  ) {}

  async execute(userId: string, limit: number = 20, offset: number = 0): Promise<RewardsActivityResponse> {
    const ledgerEntries = await this.rewardLedgerRepository.findByUserId(userId, limit + 1, offset);
    
    const hasMore = ledgerEntries.length > limit;
    const activity = ledgerEntries.slice(0, limit).map(entry => ({
      id: entry.id,
      type: entry.type,
      description: entry.description,
      points: entry.points,
      date: entry.createdAt.toISOString(),
    }));

    return {
      activity,
      hasMore,
    };
  }
}
