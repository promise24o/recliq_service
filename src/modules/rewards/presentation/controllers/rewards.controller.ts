import { Controller, Get, Post, UseGuards, Request, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';

// Use Cases
import { GetRewardsOverviewUseCase } from '../../application/use-cases/get-rewards-overview.usecase';
import { GetRewardsActivityUseCase } from '../../application/use-cases/get-rewards-activity.usecase';
import { GetStreakInfoUseCase } from '../../application/use-cases/get-streak-info.usecase';
import { GetBadgesUseCase } from '../../application/use-cases/get-badges.usecase';
import { GetEnvironmentalImpactUseCase } from '../../application/use-cases/get-environmental-impact.usecase';
import { GetChallengesUseCase } from '../../application/use-cases/get-challenges.usecase';
import { GetReferralsUseCase } from '../../application/use-cases/get-referrals.usecase';
import { RedeemReferralPointsUseCase } from '../../application/use-cases/redeem-referral-points.usecase';

// DTOs
import {
  RewardsOverviewResponseDto,
  RewardsActivityResponseDto,
  StreakInfoResponseDto,
  BadgesResponseDto,
  EnvironmentalImpactResponseDto,
  ChallengesResponseDto,
  ReferralsResponseDto,
} from '../dto';

@ApiTags('Rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RewardsController {
  constructor(
    private readonly getRewardsOverviewUseCase: GetRewardsOverviewUseCase,
    private readonly getRewardsActivityUseCase: GetRewardsActivityUseCase,
    private readonly getStreakInfoUseCase: GetStreakInfoUseCase,
    private readonly getBadgesUseCase: GetBadgesUseCase,
    private readonly getEnvironmentalImpactUseCase: GetEnvironmentalImpactUseCase,
    private readonly getChallengesUseCase: GetChallengesUseCase,
    private readonly getReferralsUseCase: GetReferralsUseCase,
    private readonly redeemReferralPointsUseCase: RedeemReferralPointsUseCase,
  ) {}

  @Get('overview')
  @ApiOperation({ 
    summary: 'Get rewards overview',
    description: 'Returns comprehensive overview of user\'s rewards including total points, current level, and progress to next level. This endpoint provides the main dashboard information for the rewards system.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rewards overview retrieved successfully',
    type: RewardsOverviewResponseDto,
    examples: {
      example: {
        summary: 'Sample rewards overview',
        value: {
          totalPoints: 1250,
          level: {
            number: 3,
            name: 'Eco Warrior'
          },
          pointsToNextLevel: 250,
          levelProgressPercent: 83
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
  })
  async getRewardsOverview(@Request() req): Promise<RewardsOverviewResponseDto> {
    return this.getRewardsOverviewUseCase.execute(req.user.id);
  }

  @Get('activity')
  @ApiOperation({ 
    summary: 'Get rewards activity feed',
    description: 'Returns paginated list of reward events and transactions in reverse chronological order. This includes all point-earning activities like recycling, streak bonuses, badge achievements, challenge completions, and referrals.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items to return (max 50, default 20)',
    example: 20
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: Number, 
    description: 'Number of items to skip for pagination (default 0)',
    example: 0
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Activity feed retrieved successfully',
    type: RewardsActivityResponseDto,
    examples: {
      example: {
        summary: 'Sample activity feed',
        value: {
          activity: [
            {
              id: '507f1f77bcf86cd799439011',
              type: 'RECYCLE',
              description: 'Recycled 5.2kg of plastic waste',
              points: 10,
              date: '2024-01-15T14:30:00.000Z'
            },
            {
              id: '507f1f77bcf86cd799439012',
              type: 'STREAK',
              description: 'Weekly streak bonus - 3 weeks active',
              points: 30,
              date: '2024-01-14T09:15:00.000Z'
            }
          ],
          hasMore: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid pagination parameters',
  })
  async getRewardsActivity(
    @Request() req,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0
  ): Promise<RewardsActivityResponseDto> {
    return this.getRewardsActivityUseCase.execute(req.user.id, limit, offset);
  }

  @Get('streak')
  @ApiOperation({ 
    summary: 'Get streak information',
    description: 'Returns comprehensive streak information including current active streak, best historical streak, weekly activity breakdown, and countdown to streak break. Streaks are maintained by consistent recycling activity within the defined interval.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Streak information retrieved successfully',
    type: StreakInfoResponseDto,
    examples: {
      example: {
        summary: 'Sample streak information',
        value: {
          currentStreakWeeks: 5,
          bestStreakWeeks: 8,
          weeklyActivity: {
            sun: true,
            mon: true,
            tue: false,
            wed: true,
            thu: false,
            fri: true,
            sat: false
          },
          isActive: true,
          daysUntilBreak: 2
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async getStreakInfo(@Request() req): Promise<StreakInfoResponseDto> {
    return this.getStreakInfoUseCase.execute(req.user.id);
  }

  @Get('badges')
  @ApiOperation({ 
    summary: 'Get user badges',
    description: 'Returns all available badges with their earned/locked status. Badges are achievements that users unlock by completing specific actions like first recycling, reaching weight thresholds, maintaining streaks, or completing challenges.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badges retrieved successfully',
    type: BadgesResponseDto,
    examples: {
      example: {
        summary: 'Sample badges response',
        value: {
          totalBadges: 12,
          earnedBadges: [
            {
              id: 'badge_first_recycle',
              name: 'First Recycle',
              description: 'Completed your first recycling pickup',
              icon: '♻️',
              criteria: 'Complete your first recycling pickup',
              earnedAt: '2024-01-15T14:30:00.000Z',
              isEarned: true
            }
          ],
          lockedBadges: [
            {
              id: 'badge_100kg',
              name: 'Century Club',
              description: 'Recycled 100kg total',
              icon: '💯',
              criteria: 'Recycle 100kg total',
              isEarned: false
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async getBadges(@Request() req): Promise<BadgesResponseDto> {
    return this.getBadgesUseCase.execute(req.user.id);
  }

  @Get('impact')
  @ApiOperation({ 
    summary: 'Get environmental impact',
    description: 'Returns comprehensive environmental impact metrics based on user\'s recycling activity. Includes CO2 savings, water conservation, energy savings, and equivalent environmental benefits like trees planted and landfill space saved.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Environmental impact retrieved successfully',
    type: EnvironmentalImpactResponseDto,
    examples: {
      example: {
        summary: 'Sample environmental impact',
        value: {
          wasteRecycledKg: 75.5,
          co2SavedKg: 125.8,
          treesEquivalent: 12,
          carbonScore: 'A+',
          waterSaved: 7550,
          energySaved: 264,
          landfillSpaceSaved: 0.23
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async getEnvironmentalImpact(@Request() req): Promise<EnvironmentalImpactResponseDto> {
    return this.getEnvironmentalImpactUseCase.execute(req.user.id);
  }

  @Get('challenges')
  @ApiOperation({ 
    summary: 'Get challenges',
    description: 'Returns active and completed challenges with progress information. Challenges are time-bound goals that users can complete to earn bonus points. Includes weekly, monthly, and referral challenges with real-time progress tracking.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Challenges retrieved successfully',
    type: ChallengesResponseDto,
    examples: {
      example: {
        summary: 'Sample challenges response',
        value: {
          activeChallenges: [
            {
              id: 'weekly_10kg',
              title: 'Recycle 10kg this week',
              description: 'Recycle a total of 10kg of waste within this week',
              progress: 7.5,
              target: 10,
              percent: 75,
              pointsReward: 50,
              daysLeft: 3,
              completed: false
            }
          ],
          completedChallenges: [
            {
              id: 'monthly_50kg',
              title: 'Recycle 50kg this month',
              description: 'Recycle a total of 50kg of waste this month',
              progress: 52,
              target: 50,
              percent: 100,
              pointsReward: 200,
              daysLeft: 0,
              completed: true,
              completedAt: '2024-01-10T16:45:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async getChallenges(@Request() req): Promise<ChallengesResponseDto> {
    return this.getChallengesUseCase.execute(req.user.id);
  }

  @Get('referrals')
  @ApiOperation({ 
    summary: 'Get referral information',
    description: 'Returns comprehensive referral statistics and recent referral activity. Includes total referral count, points earned from successful referrals, and a list of recent referrals with their status and completion details.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Referral information retrieved successfully',
    type: ReferralsResponseDto,
    examples: {
      example: {
        summary: 'Sample referrals response',
        value: {
          totalReferrals: 5,
          pointsEarned: 450,
          recentReferrals: [
            {
              id: '507f1f77bcf86cd799439011',
              name: 'User 1234abcd',
              status: 'completed',
              points: 150,
              completedAt: '2024-01-15T14:30:00.000Z',
              createdAt: '2024-01-10T09:15:00.000Z'
            },
            {
              id: '507f1f77bcf86cd799439012',
              name: 'User 5678efgh',
              status: 'pending',
              points: 0,
              createdAt: '2024-01-12T11:20:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async getReferrals(@Request() req): Promise<ReferralsResponseDto> {
    return this.getReferralsUseCase.execute(req.user.id);
  }

  @Post('referrals/redeem')
  @ApiOperation({ 
    summary: 'Redeem referral points',
    description: 'Redeems completed referral points for wallet credit. Each referral point is worth 10x its value in wallet currency. You can redeem specific referrals by providing their IDs, or redeem all completed referrals.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        referralIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of specific referral IDs to redeem. If not provided, all completed referrals will be redeemed.',
          example: ['ref_123', 'ref_456']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Referral points redeemed successfully',
    schema: {
      type: 'object',
      properties: {
        redeemedCount: { type: 'number', example: 2 },
        totalPointsRedeemed: { type: 'number', example: 200 },
        amountCredited: { type: 'number', example: 2000 },
        referrals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ref_123' },
              pointsAwarded: { type: 'number', example: 100 },
              amount: { type: 'number', example: 1000 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required',
  })
  async redeemReferralPoints(@Request() req, @Body() body: { referralIds?: string[] }) {
    return this.redeemReferralPointsUseCase.execute({
      userId: req.user.id,
      referralIds: body.referralIds,
    });
  }
}
