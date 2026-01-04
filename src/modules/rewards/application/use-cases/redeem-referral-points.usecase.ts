import { Injectable, Inject } from '@nestjs/common';
import type { IReferralRewardRepository } from '../../domain/repositories/reward.repository';
import type { IWalletRepository } from '../../../wallet/domain/repositories/wallet.repository';
import { ReferralReward } from '../../domain/entities/referral-reward.entity';
import { Wallet } from '../../../wallet/domain/entities/wallet.entity';

export interface RedeemReferralPointsInput {
  userId: string;
  referralIds?: string[]; // Optional: specific referrals to redeem, if not provided, redeem all completed
}

export interface RedeemReferralPointsOutput {
  redeemedCount: number;
  totalPointsRedeemed: number;
  amountCredited: number;
  referrals: Array<{
    id: string;
    pointsAwarded: number;
    amount: number;
  }>;
}

@Injectable()
export class RedeemReferralPointsUseCase {
  private readonly REDEMPTION_MULTIPLIER = 10; // 10x the referral points

  constructor(
    @Inject('IReferralRewardRepository')
    private readonly referralRewardRepository: IReferralRewardRepository,
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(input: RedeemReferralPointsInput): Promise<RedeemReferralPointsOutput> {
    const { userId, referralIds } = input;

    // Get referrals to redeem
    let referralsToRedeem: ReferralReward[];
    
    if (referralIds && referralIds.length > 0) {
      // Redeem specific referrals
      referralsToRedeem = [];
      for (const id of referralIds) {
        const referral = await this.referralRewardRepository.findById(id);
        if (referral && referral.referrerUserId === userId && referral.isCompleted()) {
          referralsToRedeem.push(referral);
        }
      }
    } else {
      // Redeem all completed referrals
      const allReferrals = await this.referralRewardRepository.findByReferrerId(userId);
      referralsToRedeem = allReferrals.filter(r => r.isCompleted());
    }

    if (referralsToRedeem.length === 0) {
      return {
        redeemedCount: 0,
        totalPointsRedeemed: 0,
        amountCredited: 0,
        referrals: [],
      };
    }

    // Calculate totals
    const totalPointsRedeemed = referralsToRedeem.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const amountCredited = totalPointsRedeemed * this.REDEMPTION_MULTIPLIER;

    // Get or create user's wallet
    let wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = Wallet.create(userId);
      await this.walletRepository.create(wallet);
    }

    // Credit wallet
    wallet.credit(amountCredited, `Referral points redemption (${referralsToRedeem.length} referrals)`);
    await this.walletRepository.update(wallet);

    // Mark referrals as redeemed
    const redeemedReferrals: Array<{ id: string; pointsAwarded: number; amount: number }> = [];
    for (const referral of referralsToRedeem) {
      referral.markRedeemed();
      await this.referralRewardRepository.save(referral);
      
      redeemedReferrals.push({
        id: referral.id,
        pointsAwarded: referral.pointsAwarded,
        amount: referral.pointsAwarded * this.REDEMPTION_MULTIPLIER,
      });
    }

    return {
      redeemedCount: referralsToRedeem.length,
      totalPointsRedeemed,
      amountCredited,
      referrals: redeemedReferrals,
    };
  }
}
