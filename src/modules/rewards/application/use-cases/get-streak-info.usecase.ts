import { Injectable, Inject } from '@nestjs/common';
import type { IStreakRepository } from '../../domain/repositories/reward.repository';
import { Streak } from '../../domain/entities/streak.entity';

export interface WeeklyActivity {
  sun: boolean;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
}

export interface StreakInfoResponse {
  currentStreakWeeks: number;
  bestStreakWeeks: number;
  weeklyActivity: WeeklyActivity;
  isActive: boolean;
  daysUntilBreak: number;
}

@Injectable()
export class GetStreakInfoUseCase {
  constructor(
    @Inject('IStreakRepository')
    private readonly streakRepository: IStreakRepository,
  ) {}

  async execute(userId: string): Promise<StreakInfoResponse> {
    let streak = await this.streakRepository.findByUserId(userId);
    
    // Create if doesn't exist
    if (!streak) {
      streak = await this.streakRepository.create(userId);
    }

    const streakStatus = streak.checkStreakStatus();
    const weeklyActivity = streak.getWeeklyActivity();

    return {
      currentStreakWeeks: streak.currentStreakCount,
      bestStreakWeeks: streak.bestStreak,
      weeklyActivity: streak.getWeeklyActivity() as unknown as WeeklyActivity,
      isActive: streakStatus.isActive,
      daysUntilBreak: streakStatus.daysUntilBreak,
    };
  }
}
