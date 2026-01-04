import { RewardPoints } from '../entities/reward-points.entity';
import { RewardLedger, RewardType } from '../entities/reward-ledger.entity';
import { Streak } from '../entities/streak.entity';
import { Badge, UserBadge } from '../entities/badge.entity';
import { EnvironmentalImpact } from '../entities/environmental-impact.entity';
import { Challenge, UserChallengeProgress } from '../entities/challenge.entity';
import { ReferralReward, ReferralStatus } from '../entities/referral-reward.entity';
import { RewardActivity, RewardActivityType } from '../entities/reward-activity.entity';

// Reward Points Repository
export interface IRewardPointsRepository {
  findByUserId(userId: string): Promise<RewardPoints | null>;
  save(rewardPoints: RewardPoints): Promise<RewardPoints>;
  create(userId: string): Promise<RewardPoints>;
  getTopUsers(limit: number): Promise<RewardPoints[]>;
}

// Reward Ledger Repository
export interface IRewardLedgerRepository {
  findByUserId(userId: string, limit?: number, offset?: number): Promise<RewardLedger[]>;
  findByUserIdAndType(userId: string, type: RewardType, limit?: number): Promise<RewardLedger[]>;
  findByReferenceId(referenceId: string): Promise<RewardLedger | null>;
  save(rewardLedger: RewardLedger): Promise<RewardLedger>;
  create(rewardLedger: RewardLedger): Promise<RewardLedger>;
  getTotalPointsByUserId(userId: string): Promise<number>;
  getRecentActivity(limit: number): Promise<RewardLedger[]>;
}

// Streak Repository
export interface IStreakRepository {
  findByUserId(userId: string): Promise<Streak | null>;
  save(streak: Streak): Promise<Streak>;
  create(userId: string): Promise<Streak>;
  getTopStreaks(limit: number): Promise<Streak[]>;
  getActiveStreaks(): Promise<Streak[]>;
}

// Badge Repository
export interface IBadgeRepository {
  findAll(): Promise<Badge[]>;
  findActive(): Promise<Badge[]>;
  findById(badgeId: string): Promise<Badge | null>;
  create(badge: Badge): Promise<Badge>;
  update(badge: Badge): Promise<Badge>;
}

export interface IUserBadgeRepository {
  findByUserId(userId: string): Promise<UserBadge[]>;
  findByUserIdAndBadgeId(userId: string, badgeId: string): Promise<UserBadge | null>;
  save(userBadge: UserBadge): Promise<UserBadge>;
  create(userBadge: UserBadge): Promise<UserBadge>;
  getBadgeStats(userId: string): Promise<{ total: number; earned: number }>;
  findRecentBadges(limit: number): Promise<UserBadge[]>;
}

// Environmental Impact Repository
export interface IEnvironmentalImpactRepository {
  findByUserId(userId: string): Promise<EnvironmentalImpact | null>;
  save(impact: EnvironmentalImpact): Promise<EnvironmentalImpact>;
  create(userId: string): Promise<EnvironmentalImpact>;
  getTopImpact(limit: number): Promise<EnvironmentalImpact[]>;
  getTotalImpact(): Promise<{ totalKg: number; totalCO2: number; totalTrees: number }>;
}

// Challenge Repository
export interface IChallengeRepository {
  findAll(): Promise<Challenge[]>;
  findActive(): Promise<Challenge[]>;
  findById(challengeId: string): Promise<Challenge | null>;
  save(challenge: Challenge): Promise<Challenge>;
  create(challenge: Challenge): Promise<Challenge>;
}

export interface IUserChallengeProgressRepository {
  findByUserId(userId: string): Promise<UserChallengeProgress[]>;
  findByUserIdAndChallengeId(userId: string, challengeId: string): Promise<UserChallengeProgress | null>;
  save(progress: UserChallengeProgress): Promise<UserChallengeProgress>;
  create(progress: UserChallengeProgress): Promise<UserChallengeProgress>;
  getActiveChallenges(userId: string): Promise<UserChallengeProgress[]>;
  getCompletedChallenges(userId: string): Promise<UserChallengeProgress[]>;
}

// Referral Reward Repository
export interface IReferralRewardRepository {
  findByReferrerId(referrerUserId: string): Promise<ReferralReward[]>;
  findByReferredId(referredUserId: string): Promise<ReferralReward | null>;
  findById(id: string): Promise<ReferralReward | null>;
  save(referral: ReferralReward): Promise<ReferralReward>;
  create(referral: ReferralReward): Promise<ReferralReward>;
  findByStatus(status: ReferralStatus): Promise<ReferralReward[]>;
  getReferralStats(userId: string): Promise<{ total: number; completed: number; points: number }>;
}

// Reward Activity Repository
export interface IRewardActivityRepository {
  findByUserId(userId: string, limit?: number, offset?: number): Promise<RewardActivity[]>;
  create(activity: RewardActivity): Promise<RewardActivity>;
  findByType(userId: string, type: RewardActivityType): Promise<RewardActivity[]>;
  countByUserId(userId: string): Promise<number>;
}
