import { Injectable, Logger, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RewardPoints } from '../../domain/entities/reward-points.entity';
import { RewardLedger, RewardType } from '../../domain/entities/reward-ledger.entity';
import { Streak } from '../../domain/entities/streak.entity';
import { Badge, UserBadge } from '../../domain/entities/badge.entity';
import { EnvironmentalImpact } from '../../domain/entities/environmental-impact.entity';
import { Challenge, UserChallengeProgress } from '../../domain/entities/challenge.entity';
import { ReferralReward, ReferralStatus } from '../../domain/entities/referral-reward.entity';
import type {
  IRewardPointsRepository,
  IRewardLedgerRepository,
  IStreakRepository,
  IBadgeRepository,
  IUserBadgeRepository,
  IEnvironmentalImpactRepository,
  IChallengeRepository,
  IUserChallengeProgressRepository,
  IReferralRewardRepository,
} from '../../domain/repositories/reward.repository';

// Event interfaces for different reward triggers
export interface PickupCompletedEvent {
  userId: string;
  pickupId: string;
  weight: number;
  materialType: string;
  completedAt: Date;
}

export interface ReferralCompletedEvent {
  referrerUserId: string;
  referredUserId: string;
  completedAt: Date;
}

export interface ChallengeCompletedEvent {
  userId: string;
  challengeId: string;
  completedAt: Date;
}

@Injectable()
export class RewardEngineService {
  private readonly logger = new Logger(RewardEngineService.name);

  // Point rules (configurable)
  private readonly POINT_RULES = {
    FIRST_RECYCLE: 50,
    PER_KG_RECYCLED: 20,
    WEEKLY_STREAK: 30,
    CHALLENGE_COMPLETED: 50,
    SUCCESSFUL_REFERRAL: 100,
    BADGE_EARNED: 25,
  };

  constructor(
    @Inject('IRewardPointsRepository')
    private readonly rewardPointsRepository: IRewardPointsRepository,
    @Inject('IRewardLedgerRepository')
    private readonly rewardLedgerRepository: IRewardLedgerRepository,
    @Inject('IStreakRepository')
    private readonly streakRepository: IStreakRepository,
    @Inject('IBadgeRepository')
    private readonly badgeRepository: IBadgeRepository,
    @Inject('IUserBadgeRepository')
    private readonly userBadgeRepository: IUserBadgeRepository,
    @Inject('IEnvironmentalImpactRepository')
    private readonly environmentalImpactRepository: IEnvironmentalImpactRepository,
    @Inject('IChallengeRepository')
    private readonly challengeRepository: IChallengeRepository,
    @Inject('IUserChallengeProgressRepository')
    private readonly userChallengeProgressRepository: IUserChallengeProgressRepository,
    @Inject('IReferralRewardRepository')
    private readonly referralRewardRepository: IReferralRewardRepository,
  ) {}

  // Main event handlers

  async handlePickupCompleted(event: PickupCompletedEvent): Promise<void> {
    this.logger.log(`Processing pickup completed event for user ${event.userId}`);
    
    try {
      // Check for idempotency - ensure this pickup hasn't been rewarded already
      const existingReward = await this.rewardLedgerRepository.findByReferenceId(event.pickupId);
      if (existingReward) {
        this.logger.log(`Pickup ${event.pickupId} already rewarded, skipping`);
        return;
      }

      // Get or create user's reward points
      let rewardPoints = await this.rewardPointsRepository.findByUserId(event.userId);
      if (!rewardPoints) {
        rewardPoints = await this.rewardPointsRepository.create(event.userId);
      }

      // Check if this is first recycle
      const userLedger = await this.rewardLedgerRepository.findByUserIdAndType(
        event.userId,
        RewardType.RECYCLE,
        1
      );
      const isFirstRecycle = userLedger.length === 0;

      // Calculate points
      let points = 0;
      if (isFirstRecycle) {
        points += this.POINT_RULES.FIRST_RECYCLE;
      }
      points += event.weight * this.POINT_RULES.PER_KG_RECYCLED;

      // Create ledger entry
      const ledgerEntry = RewardLedger.createRecycleReward({
        id: uuidv4(),
        userId: event.userId,
        points: points,
        pickupId: event.pickupId,
        weight: event.weight,
      });

      await this.rewardLedgerRepository.create(ledgerEntry);

      // Update reward points
      rewardPoints.addPoints(points);
      await this.rewardPointsRepository.save(rewardPoints);

      // Update environmental impact
      await this.updateEnvironmentalImpact(event.userId, event.weight, event.materialType);

      // Update streak
      await this.updateStreak(event.userId, event.completedAt);

      // Update challenge progress
      await this.updateChallengeProgress(event.userId, 'kg', event.weight);

      // Check for new badges
      await this.evaluateBadges(event.userId, ledgerEntry.id);

      this.logger.log(`Successfully processed pickup completed for user ${event.userId}, awarded ${points} points`);

    } catch (error) {
      this.logger.error(`Error processing pickup completed for user ${event.userId}: ${error.message}`);
      throw error;
    }
  }

  async handleReferralCompleted(event: ReferralCompletedEvent): Promise<void> {
    this.logger.log(`Processing referral completed event for referrer ${event.referrerUserId}`);

    try {
      // Find the referral record
      const referral = await this.referralRewardRepository.findByReferredId(event.referredUserId);
      if (!referral) {
        this.logger.log(`No referral found for user ${event.referredUserId}`);
        return;
      }

      if (referral.isCompleted()) {
        this.logger.log(`Referral ${referral.id} already completed`);
        return;
      }

      // Mark referral as completed and award points
      referral.markCompleted(this.POINT_RULES.SUCCESSFUL_REFERRAL);
      await this.referralRewardRepository.save(referral);

      // Create ledger entry
      const ledgerEntry = RewardLedger.createReferralReward({
        id: uuidv4(),
        userId: event.referrerUserId,
        points: this.POINT_RULES.SUCCESSFUL_REFERRAL,
        referredUserId: event.referredUserId,
      });

      await this.rewardLedgerRepository.create(ledgerEntry);

      // Update reward points
      let rewardPoints = await this.rewardPointsRepository.findByUserId(event.referrerUserId);
      if (!rewardPoints) {
        rewardPoints = await this.rewardPointsRepository.create(event.referrerUserId);
      }

      rewardPoints.addPoints(this.POINT_RULES.SUCCESSFUL_REFERRAL);
      await this.rewardPointsRepository.save(rewardPoints);

      // Check for new badges
      await this.evaluateBadges(event.referrerUserId, ledgerEntry.id);

      this.logger.log(`Successfully processed referral completed for user ${event.referrerUserId}`);

    } catch (error) {
      this.logger.error(`Error processing referral completed: ${error.message}`);
      throw error;
    }
  }

  async handleChallengeCompleted(event: ChallengeCompletedEvent): Promise<void> {
    this.logger.log(`Processing challenge completed event for user ${event.userId}`);

    try {
      // Get challenge details
      const challenge = await this.challengeRepository.findById(event.challengeId);
      if (!challenge) {
        this.logger.log(`Challenge ${event.challengeId} not found`);
        return;
      }

      // Get user's progress
      let progress = await this.userChallengeProgressRepository.findByUserIdAndChallengeId(
        event.userId,
        event.challengeId
      );
      if (!progress) {
        this.logger.log(`No progress found for user ${event.userId} in challenge ${event.challengeId}`);
        return;
      }

      if (progress.completed) {
        this.logger.log(`Challenge ${event.challengeId} already completed for user ${event.userId}`);
        return;
      }

      // Mark as completed
      progress.markCompleted();
      await this.userChallengeProgressRepository.save(progress);

      // Create ledger entry
      const ledgerEntry = RewardLedger.createChallengeReward({
        id: uuidv4(),
        userId: event.userId,
        points: challenge.rewardPoints,
        challengeId: event.challengeId,
        challengeTitle: challenge.title,
      });

      await this.rewardLedgerRepository.create(ledgerEntry);

      // Update reward points
      let rewardPoints = await this.rewardPointsRepository.findByUserId(event.userId);
      if (!rewardPoints) {
        rewardPoints = await this.rewardPointsRepository.create(event.userId);
      }

      rewardPoints.addPoints(challenge.rewardPoints);
      await this.rewardPointsRepository.save(rewardPoints);

      // Check for new badges
      await this.evaluateBadges(event.userId, ledgerEntry.id);

      this.logger.log(`Successfully processed challenge completed for user ${event.userId}`);

    } catch (error) {
      this.logger.error(`Error processing challenge completed: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  private async updateEnvironmentalImpact(userId: string, weight: number, materialType: string): Promise<void> {
    let impact = await this.environmentalImpactRepository.findByUserId(userId);
    if (!impact) {
      impact = await this.environmentalImpactRepository.create(userId);
    }

    impact.addRecycledWeight(weight, materialType);
    await this.environmentalImpactRepository.save(impact);
  }

  private async updateStreak(userId: string, recycleDate: Date): Promise<void> {
    let streak = await this.streakRepository.findByUserId(userId);
    if (!streak) {
      streak = await this.streakRepository.create(userId);
    }

    const streakMaintained = streak.updateStreak(recycleDate);
    await this.streakRepository.save(streak);

    // Award streak points if streak was maintained (not broken)
    if (streakMaintained && streak.currentStreakCount > 0) {
      // Check if we already awarded streak points this week
      const weekStart = new Date(recycleDate);
      weekStart.setDate(recycleDate.getDate() - recycleDate.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const existingStreakReward = await this.rewardLedgerRepository.findByReferenceId(
        `streak_${streak.currentStreakCount}_${weekStart.getTime()}`
      );

      if (!existingStreakReward) {
        const ledgerEntry = RewardLedger.createStreakReward({
          id: uuidv4(),
          userId: userId,
          points: this.POINT_RULES.WEEKLY_STREAK,
          streakWeeks: streak.currentStreakCount,
        });

        await this.rewardLedgerRepository.create(ledgerEntry);

        // Update reward points
        let rewardPoints = await this.rewardPointsRepository.findByUserId(userId);
        if (rewardPoints) {
          rewardPoints.addPoints(this.POINT_RULES.WEEKLY_STREAK);
          await this.rewardPointsRepository.save(rewardPoints);
        }
      }
    }
  }

  private async updateChallengeProgress(userId: string, goalType: string, value: number): Promise<void> {
    // Get active challenges for the user
    const activeChallenges = await this.challengeRepository.findActive();
    
    for (const challenge of activeChallenges) {
      if (challenge.goalType === goalType) {
        let progress = await this.userChallengeProgressRepository.findByUserIdAndChallengeId(
          userId,
          challenge.challengeId
        );

        if (!progress) {
          progress = UserChallengeProgress.create(userId, challenge.challengeId);
          progress = await this.userChallengeProgressRepository.create(progress);
        }

        if (!progress.completed) {
          const newProgress = Math.min(progress.currentProgress + value, challenge.targetValue);
          progress.updateProgress(newProgress);

          if (challenge.isCompleted(newProgress)) {
            progress.markCompleted();
          }

          await this.userChallengeProgressRepository.save(progress);
        }
      }
    }
  }

  private async evaluateBadges(userId: string, sourceEventId: string): Promise<void> {
    // Get all active badges
    const badges = await this.badgeRepository.findActive();
    
    for (const badge of badges) {
      // Check if user already has this badge
      const existingUserBadge = await this.userBadgeRepository.findByUserIdAndBadgeId(userId, badge.badgeId);
      if (existingUserBadge) {
        continue; // User already has this badge
      }

      // Check if user meets badge criteria
      const earned = await this.checkBadgeCriteria(userId, badge);
      
      if (earned) {
        // Award badge
        const userBadge = UserBadge.create({
          userId: userId,
          badgeId: badge.badgeId,
          sourceEventId: sourceEventId,
        });

        await this.userBadgeRepository.create(userBadge);

        // Award badge points
        const ledgerEntry = RewardLedger.createBadgeReward({
          id: uuidv4(),
          userId: userId,
          points: this.POINT_RULES.BADGE_EARNED,
          badgeId: badge.badgeId,
          badgeName: badge.name,
        });

        await this.rewardLedgerRepository.create(ledgerEntry);

        // Update reward points
        let rewardPoints = await this.rewardPointsRepository.findByUserId(userId);
        if (rewardPoints) {
          rewardPoints.addPoints(this.POINT_RULES.BADGE_EARNED);
          await this.rewardPointsRepository.save(rewardPoints);
        }

        this.logger.log(`User ${userId} earned badge: ${badge.name}`);
      }
    }
  }

  private async checkBadgeCriteria(userId: string, badge: Badge): Promise<boolean> {
    switch (badge.criteria.type) {
      case 'FIRST_RECYCLE':
        const recycleEntries = await this.rewardLedgerRepository.findByUserIdAndType(
          userId,
          RewardType.RECYCLE,
          1
        );
        return recycleEntries.length >= badge.criteria.value;

      case 'WEIGHT_THRESHOLD':
        const impact = await this.environmentalImpactRepository.findByUserId(userId);
        return impact ? impact.totalKgRecycled >= badge.criteria.value : false;

      case 'PICKUP_COUNT':
        const pickupCount = await this.rewardLedgerRepository.findByUserIdAndType(
          userId,
          RewardType.RECYCLE
        );
        return pickupCount.length >= badge.criteria.value;

      case 'STREAK_WEEKS':
        const streak = await this.streakRepository.findByUserId(userId);
        return streak ? streak.bestStreak >= badge.criteria.value : false;

      case 'REFERRAL_COUNT':
        const referralStats = await this.referralRewardRepository.getReferralStats(userId);
        return referralStats.completed >= badge.criteria.value;

      default:
        return false;
    }
  }
}
