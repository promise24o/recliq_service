import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// Controller
import { RewardsController } from './presentation/controllers/rewards.controller';
import { BadgeAdminController } from './presentation/controllers/badge-admin.controller';

// Use Cases
import { GetRewardsOverviewUseCase } from './application/use-cases/get-rewards-overview.usecase';
import { GetRewardsActivityUseCase } from './application/use-cases/get-rewards-activity.usecase';
import { GetStreakInfoUseCase } from './application/use-cases/get-streak-info.usecase';
import { GetBadgesUseCase } from './application/use-cases/get-badges.usecase';
import { GetEnvironmentalImpactUseCase } from './application/use-cases/get-environmental-impact.usecase';
import { GetChallengesUseCase } from './application/use-cases/get-challenges.usecase';
import { GetReferralsUseCase } from './application/use-cases/get-referrals.usecase';
import { RedeemReferralPointsUseCase } from './application/use-cases/redeem-referral-points.usecase';

// Services
import { RewardEngineService } from './application/services/reward-engine.service';
import { BadgeSeedService } from './infrastructure/services/badge-seed.service';
import { UserSeedingService } from './infrastructure/services/user-seeding.service';

// Repositories
import { RewardPointsRepositoryImpl } from './infrastructure/persistence/reward-points.repository.impl';
import { RewardLedgerRepositoryImpl } from './infrastructure/persistence/reward-ledger.repository.impl';
import { StreakRepositoryImpl } from './infrastructure/persistence/streak.repository.impl';
import { BadgeRepositoryImpl } from './infrastructure/persistence/badge.repository.impl';
import { UserBadgeRepositoryImpl } from './infrastructure/persistence/badge.repository.impl';
import { EnvironmentalImpactRepositoryImpl } from './infrastructure/persistence/environmental-impact.repository.impl';
import { ChallengeRepositoryImpl } from './infrastructure/persistence/challenge.repository.impl';
import { UserChallengeProgressRepositoryImpl } from './infrastructure/persistence/challenge.repository.impl';
import { ReferralRewardRepositoryImpl } from './infrastructure/persistence/referral-reward.repository.impl';
import { AuthRepositoryImpl } from '../auth/infrastructure/persistence/auth.repository.impl';
import { WalletRepositoryImpl } from '../wallet/infrastructure/persistence/wallet.repository.impl';

// Models
import { RewardPointsSchema } from './infrastructure/persistence/reward-points.model';
import { RewardLedgerSchema } from './infrastructure/persistence/reward-ledger.model';
import { StreakSchema } from './infrastructure/persistence/streak.model';
import { BadgeSchema, UserBadgeSchema } from './infrastructure/persistence/badge.model';
import { EnvironmentalImpactSchema } from './infrastructure/persistence/environmental-impact.model';
import { ChallengeSchema, UserChallengeProgressSchema } from './infrastructure/persistence/challenge.model';
import { ReferralRewardSchema } from './infrastructure/persistence/referral-reward.model';
import { UserSchema } from '../auth/infrastructure/persistence/user.model';
import { WalletSchema } from '../wallet/infrastructure/persistence/wallet.model';

// Repository Interfaces
import {
  IRewardPointsRepository,
  IRewardLedgerRepository,
  IStreakRepository,
  IBadgeRepository,
  IUserBadgeRepository,
  IEnvironmentalImpactRepository,
  IChallengeRepository,
  IUserChallengeProgressRepository,
  IReferralRewardRepository,
} from './domain/repositories/reward.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RewardPointsDocument', schema: RewardPointsSchema },
      { name: 'RewardLedgerDocument', schema: RewardLedgerSchema },
      { name: 'StreakDocument', schema: StreakSchema },
      { name: 'BadgeDocument', schema: BadgeSchema },
      { name: 'UserBadgeDocument', schema: UserBadgeSchema },
      { name: 'EnvironmentalImpactDocument', schema: EnvironmentalImpactSchema },
      { name: 'ChallengeDocument', schema: ChallengeSchema },
      { name: 'UserChallengeProgressDocument', schema: UserChallengeProgressSchema },
      { name: 'ReferralRewardDocument', schema: ReferralRewardSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Wallet', schema: WalletSchema },
    ]),
  ],
  controllers: [RewardsController, BadgeAdminController],
  providers: [
    // Reward Engine Service
    RewardEngineService,
    
    // Badge Seed Service
    BadgeSeedService,
    
    // User Seeding Service
    UserSeedingService,

    // Repository Implementations
    {
      provide: 'IRewardPointsRepository',
      useClass: RewardPointsRepositoryImpl,
    },
    {
      provide: 'IRewardLedgerRepository',
      useClass: RewardLedgerRepositoryImpl,
    },
    {
      provide: 'IStreakRepository',
      useClass: StreakRepositoryImpl,
    },
    {
      provide: 'IBadgeRepository',
      useClass: BadgeRepositoryImpl,
    },
    {
      provide: 'IUserBadgeRepository',
      useClass: UserBadgeRepositoryImpl,
    },
    {
      provide: 'IEnvironmentalImpactRepository',
      useClass: EnvironmentalImpactRepositoryImpl,
    },
    {
      provide: 'IChallengeRepository',
      useClass: ChallengeRepositoryImpl,
    },
    {
      provide: 'IUserChallengeProgressRepository',
      useClass: UserChallengeProgressRepositoryImpl,
    },
    {
      provide: 'IReferralRewardRepository',
      useClass: ReferralRewardRepositoryImpl,
    },
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryImpl,
    },
    {
      provide: 'IWalletRepository',
      useClass: WalletRepositoryImpl,
    },

    // Use Cases
    GetRewardsOverviewUseCase,
    GetRewardsActivityUseCase,
    GetStreakInfoUseCase,
    GetBadgesUseCase,
    GetEnvironmentalImpactUseCase,
    GetChallengesUseCase,
    GetReferralsUseCase,
    RedeemReferralPointsUseCase,
  ],
  exports: [
    RewardEngineService,
    'IRewardPointsRepository',
    'IRewardLedgerRepository',
    'IStreakRepository',
    'IBadgeRepository',
    'IUserBadgeRepository',
    'IEnvironmentalImpactRepository',
    'IChallengeRepository',
    'IUserChallengeProgressRepository',
    'IReferralRewardRepository',
  ],
})
export class RewardsModule {}
