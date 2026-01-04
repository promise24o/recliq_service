import { Injectable, Inject } from '@nestjs/common';
import type { IReferralRewardRepository } from '../../domain/repositories/reward.repository';
import { ReferralReward } from '../../domain/entities/referral-reward.entity';

export interface ReferralItem {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'cancelled' | 'redeemed';
  points: number;
  completedAt?: string;
  createdAt: string;
}

export interface ReferralsResponse {
  totalReferrals: number;
  pointsEarned: number;
  pointsRedeemed: number;
  recentReferrals: ReferralItem[];
}

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @Inject('IReferralRewardRepository')
    private readonly referralRewardRepository: IReferralRewardRepository,
  ) {}

  async execute(userId: string): Promise<ReferralsResponse> {
    // Get recent referrals
    const referrals = await this.referralRewardRepository.findByReferrerId(userId);
    
    // Calculate points
    const pointsEarned = referrals
      .filter(r => r.isCompleted() || r.isRedeemed())
      .reduce((sum, r) => sum + r.pointsAwarded, 0);
    
    const pointsRedeemed = referrals
      .filter(r => r.isRedeemed())
      .reduce((sum, r) => sum + r.pointsAwarded, 0);
    
    const recentReferrals: ReferralItem[] = referrals.slice(0, 10).map(referral => ({
      id: referral.id,
      name: this.getReferralName(referral.referredUserId), // In real implementation, fetch from user service
      status: referral.status as 'pending' | 'completed' | 'cancelled' | 'redeemed',
      points: referral.pointsAwarded,
      completedAt: referral.completedAt?.toISOString(),
      createdAt: referral.createdAt.toISOString(),
    }));

    return {
      totalReferrals: referrals.length,
      pointsEarned,
      pointsRedeemed,
      recentReferrals,
    };
  }

  private getReferralName(userId: string): string {
    // In a real implementation, you would fetch the user's name from the user service
    // For now, return a placeholder
    return `User ${userId.substring(0, 8)}`;
  }
}
