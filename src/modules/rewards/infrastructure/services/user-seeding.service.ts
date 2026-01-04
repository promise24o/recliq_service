import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { IUserBadgeRepository, IStreakRepository, IBadgeRepository, IEnvironmentalImpactRepository, IChallengeRepository, IUserChallengeProgressRepository, IReferralRewardRepository } from '../../domain/repositories/reward.repository';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { User } from '../../../auth/domain/entities/user.entity';
import { UserBadge } from '../../domain/entities/badge.entity';
import { Streak } from '../../domain/entities/streak.entity';
import { EnvironmentalImpact } from '../../domain/entities/environmental-impact.entity';
import { Challenge, UserChallengeProgress } from '../../domain/entities/challenge.entity';
import { ReferralReward, ReferralStatus } from '../../domain/entities/referral-reward.entity';
import { ReferralCodeUtil } from '../../../../shared/utils/referral-code.util';

@Injectable()
export class UserSeedingService {
  private readonly logger = new Logger(UserSeedingService.name);

  constructor(
    @Inject('IUserBadgeRepository')
    private readonly userBadgeRepository: IUserBadgeRepository,
    @Inject('IStreakRepository')
    private readonly streakRepository: IStreakRepository,
    @Inject('IBadgeRepository')
    private readonly badgeRepository: IBadgeRepository,
    @Inject('IEnvironmentalImpactRepository')
    private readonly environmentalImpactRepository: IEnvironmentalImpactRepository,
    @Inject('IChallengeRepository')
    private readonly challengeRepository: IChallengeRepository,
    @Inject('IUserChallengeProgressRepository')
    private readonly userChallengeProgressRepository: IUserChallengeProgressRepository,
    @Inject('IReferralRewardRepository')
    private readonly referralRewardRepository: IReferralRewardRepository,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async seedUserData(userId: string): Promise<void> {
    try {
      this.logger.log(`Seeding data for user: ${userId}`);
      
      // Assign referral code if user doesn't have one
      await this.assignReferralCode(userId);
      
      // Seed user badges
      await this.seedUserBadges(userId);
      
      // Seed user streak
      await this.seedUserStreak(userId);
      
      // Seed environmental impact
      await this.seedEnvironmentalImpact(userId);
      
      // Seed challenges
      await this.seedUserChallenges(userId);
      
      // Seed referrals
      await this.seedUserReferrals(userId);
      
      this.logger.log(`Successfully seeded data for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to seed data for user ${userId}:`, error);
      throw error;
    }
  }

  private async assignReferralCode(userId: string): Promise<void> {
    const user = await this.authRepository.findById(userId);
    
    if (!user) {
      this.logger.error(`User ${userId} not found`);
      return;
    }
    
    if (!user.referralCode) {
      let userReferralCode: string;
      let isCodeUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Generate unique referral code with retry logic
      do {
        userReferralCode = ReferralCodeUtil.generateReferralCode();
        const existingUser = await this.authRepository.findByReferralCode(userReferralCode);
        if (!existingUser) {
          isCodeUnique = true;
        }
        attempts++;
      } while (!isCodeUnique && attempts < maxAttempts);
      
      if (!isCodeUnique) {
        throw new Error('Failed to generate unique referral code after multiple attempts');
      }
      
      // Create a new User instance with the referral code
      // Since User entity is immutable, we need to create a new instance
      const updatedUser = new User(
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.isVerified,
        user.password,
        user.pin,
        user.biometricEnabled,
        user.profilePhoto,
        userReferralCode, // Add the referral code
        user.notifications,
        user.otp,
        user.otpExpiresAt,
        user.createdAt,
        new Date(), // Update the timestamp
      );
      
      await this.authRepository.update(updatedUser);
      this.logger.log(`Assigned referral code ${userReferralCode} to user ${userId}`);
    } else {
      this.logger.log(`User ${userId} already has referral code: ${user.referralCode}`);
    }
  }

  private async seedUserBadges(userId: string): Promise<void> {
    // Get all available badges
    const availableBadges = await this.badgeRepository.findActive();
    
    // Award specific badges to the user by their badgeId
    const badgeIdsToAward = [
      'FIRST_RECYCLE',
      'WEIGHT_50KG',
      'CARBON_SAVER',
    ];
    
    for (const badgeId of badgeIdsToAward) {
      // Find badge by badgeId
      const badge = availableBadges.find(b => b.badgeId === badgeId);
      
      if (!badge) {
        this.logger.warn(`Badge with ID ${badgeId} not found`);
        continue;
      }
      
      // Check if user already has this badge
      const existingUserBadge = await this.userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId);
      
      if (!existingUserBadge) {
        const userBadge = UserBadge.create({
          userId,
          badgeId: badgeId,
          sourceEventId: `seed_${Date.now()}_${badgeId}`,
        });
        
        await this.userBadgeRepository.create(userBadge);
        this.logger.log(`Awarded badge '${badge.name}' to user ${userId}`);
      } else {
        this.logger.log(`User ${userId} already has badge '${badge.name}'`);
      }
    }
  }

  private async seedUserStreak(userId: string): Promise<void> {
    // Check if user already has a streak
    const existingStreak = await this.streakRepository.findByUserId(userId);
    
    if (!existingStreak) {
      // Create a new streak with Monday-Saturday activity for this week
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate last Monday
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - daysSinceMonday);
      lastMonday.setHours(0, 0, 0, 0);
      
      // Calculate last Saturday
      const lastSaturday = new Date(lastMonday);
      lastSaturday.setDate(lastMonday.getDate() + 5);
      lastSaturday.setHours(23, 59, 59, 999);
      
      // Create streak with 6 days (Monday to Saturday)
      const streak = new Streak(
        userId,
        6, // currentStreakCount - 6 days (Mon-Sat)
        6, // bestStreak - best streak is also 6
        lastSaturday, // lastRecycleDate - last activity was Saturday
        7, // streakInterval - 7 days
        true // isActive - currently active
      );
      
      await this.streakRepository.create(userId);
      this.logger.log(`Created Monday-Saturday streak for user ${userId}: 6 days current, 6 days best`);
      this.logger.log(`Streak period: ${lastMonday.toDateString()} to ${lastSaturday.toDateString()}`);
    } else {
      // Update existing streak to have Monday-Saturday activity
      const today = new Date();
      const currentDay = today.getDay();
      
      // Calculate last Monday and Saturday
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - daysSinceMonday);
      lastMonday.setHours(0, 0, 0, 0);
      
      const lastSaturday = new Date(lastMonday);
      lastSaturday.setDate(lastMonday.getDate() + 5);
      lastSaturday.setHours(23, 59, 59, 999);
      
      // Update the existing streak
      existingStreak.currentStreakCount = 6;
      existingStreak.bestStreak = Math.max(existingStreak.bestStreak, 6);
      existingStreak.lastRecycleDate = lastSaturday;
      existingStreak.isActive = true;
      
      await this.streakRepository.save(existingStreak);
      this.logger.log(`Updated streak for user ${userId}: 6 days current, ${existingStreak.bestStreak} days best`);
      this.logger.log(`Streak period: ${lastMonday.toDateString()} to ${lastSaturday.toDateString()}`);
    }
  }

  private async seedEnvironmentalImpact(userId: string): Promise<void> {
    // Check if user already has environmental impact data
    const existingImpact = await this.environmentalImpactRepository.findByUserId(userId);
    
    if (!existingImpact) {
      // Create environmental impact with sample data
      const impact = new EnvironmentalImpact(
        userId,
        75.5, // totalKgRecycled
        125.8, // co2SavedKg
        12, // treesEquivalent
        'A+', // carbonScore
        new Date() // lastUpdatedAt
      );
      
      await this.environmentalImpactRepository.create(userId);
      this.logger.log(`Created environmental impact for user ${userId}:`);
      this.logger.log(`  - Waste recycled: ${impact.totalKgRecycled}kg`);
      this.logger.log(`  - CO2 saved: ${impact.co2SavedKg}kg`);
      this.logger.log(`  - Trees equivalent: ${impact.treesEquivalent}`);
      this.logger.log(`  - Carbon score: ${impact.carbonScore}`);
      this.logger.log(`  - Water saved: ${impact.getWaterSaved()} liters`);
      this.logger.log(`  - Energy saved: ${impact.getEnergySaved()} kWh`);
      this.logger.log(`  - Landfill space saved: ${impact.getLandfillSpaceSaved()} m³`);
    } else {
      this.logger.log(`User ${userId} already has environmental impact data`);
    }
  }

  private async seedUserChallenges(userId: string): Promise<void> {
    // Get all active challenges
    let activeChallenges = await this.challengeRepository.findActive();
    
    // If no challenges exist, create default challenges
    if (activeChallenges.length === 0) {
      this.logger.log('No challenges found, creating default challenges...');
      const defaultChallenges = Challenge.createDefaultChallenges();
      
      for (const challenge of defaultChallenges) {
        await this.challengeRepository.create(challenge);
        this.logger.log(`Created challenge: ${challenge.title}`);
      }
      
      // Get the newly created challenges
      activeChallenges = await this.challengeRepository.findActive();
    }
    
    // Get user's existing challenge progress
    const userProgress = await this.userChallengeProgressRepository.findByUserId(userId);
    const progressMap = new Map(userProgress.map(p => [p.challengeId, p]));
    
    // Create progress for selected challenges
    const challengesToSeed = [
      { challengeId: 'weekly_10kg', progress: 7, completed: false }, // Active: 7/10 kg
      { challengeId: 'weekly_3_pickups', progress: 3, completed: true }, // Completed: 3/3 pickups
      { challengeId: 'monthly_50kg', progress: 35, completed: false }, // Active: 35/50 kg
      { challengeId: 'referral_2', progress: 2, completed: true }, // Completed: 2/2 referrals
    ];
    
    for (const { challengeId, progress, completed } of challengesToSeed) {
      // Check if progress already exists
      if (!progressMap.has(challengeId)) {
        const challenge = activeChallenges.find(c => c.challengeId === challengeId);
        
        if (challenge) {
          const userChallenge = UserChallengeProgress.create(userId, challengeId);
          userChallenge.updateProgress(progress);
          
          if (completed) {
            userChallenge.markCompleted();
            // Set completion date to a few days ago
            userChallenge.completedAt = new Date();
            userChallenge.completedAt.setDate(userChallenge.completedAt.getDate() - 3);
          }
          
          await this.userChallengeProgressRepository.create(userChallenge);
          
          const status = completed ? 'completed' : 'in progress';
          const percent = challenge.getProgressPercent(progress);
          this.logger.log(`Created challenge progress for user ${userId}: ${challenge.title} - ${status} (${progress}/${challenge.targetValue}, ${percent}%)`);
        }
      }
    }
  }

  private async seedUserReferrals(userId: string): Promise<void> {
    // Get existing referrals for the user
    const existingReferrals = await this.referralRewardRepository.findByReferrerId(userId);
    
    if (existingReferrals.length === 0) {
      // Create 5 sample referrals
      const sampleReferrals = [
        { referredUserId: 'user1234abcd', status: ReferralStatus.COMPLETED, points: 100, daysAgo: 5 },
        { referredUserId: 'user5678efgh', status: ReferralStatus.COMPLETED, points: 100, daysAgo: 10 },
        { referredUserId: 'user9012ijkl', status: ReferralStatus.PENDING, points: 0, daysAgo: 2 },
        { referredUserId: 'user3456mnop', status: ReferralStatus.PENDING, points: 0, daysAgo: 7 },
        { referredUserId: 'user7890qrst', status: ReferralStatus.CANCELLED, points: 0, daysAgo: 15 },
      ];
      
      for (const referral of sampleReferrals) {
        const referralId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let newReferral: ReferralReward;
        
        if (referral.status === ReferralStatus.COMPLETED) {
          // Create completed referral
          const completedAt = new Date();
          completedAt.setDate(completedAt.getDate() - referral.daysAgo);
          
          const createdAt = new Date(completedAt);
          createdAt.setDate(createdAt.getDate() - 5);
          
          newReferral = new ReferralReward(
            referralId,
            userId,
            referral.referredUserId,
            ReferralStatus.COMPLETED,
            referral.points,
            completedAt,
            createdAt
          );
        } else {
          // Create pending or cancelled referral
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - referral.daysAgo);
          
          newReferral = new ReferralReward(
            referralId,
            userId,
            referral.referredUserId,
            referral.status,
            0,
            null,
            createdAt
          );
        }
        
        await this.referralRewardRepository.create(newReferral);
        
        const statusText = referral.status === ReferralStatus.COMPLETED ? 'completed' : 
                          referral.status === ReferralStatus.PENDING ? 'pending' : 'cancelled';
        const pointsText = referral.points > 0 ? ` (${referral.points} points)` : '';
        this.logger.log(`Created referral for user ${userId}: ${referral.referredUserId} - ${statusText}${pointsText}`);
      }
      
      const totalPoints = sampleReferrals.reduce((sum, r) => sum + r.points, 0);
      this.logger.log(`Created 5 referrals for user ${userId} with ${totalPoints} total points earned`);
    } else {
      this.logger.log(`User ${userId} already has ${existingReferrals.length} referrals`);
    }
  }
}
