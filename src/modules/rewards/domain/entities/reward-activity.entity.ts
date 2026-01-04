import { v4 as uuidv4 } from 'uuid';

export enum RewardActivityType {
  STREAK = 'STREAK',
  BADGE = 'BADGE',
  REFERRAL = 'REFERRAL',
  CHALLENGE = 'CHALLENGE',
  RECYCLING = 'RECYCLING',
  LEVEL_UP = 'LEVEL_UP',
}

export class RewardActivity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: RewardActivityType,
    public readonly description: string,
    public readonly points: number,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(data: {
    userId: string;
    type: RewardActivityType;
    description: string;
    points: number;
    metadata?: Record<string, any>;
  }): RewardActivity {
    return new RewardActivity(
      uuidv4(),
      data.userId,
      data.type,
      data.description,
      data.points,
      data.metadata,
      new Date(),
    );
  }

  // Factory methods for common activity types
  static streakMaintained(userId: string, streakDays: number, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.STREAK,
      description: `Weekly streak maintained (${streakDays} days)`,
      points,
      metadata: { streakDays },
    });
  }

  static badgeEarned(userId: string, badgeName: string, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.BADGE,
      description: `Badge earned: ${badgeName}`,
      points,
      metadata: { badgeName },
    });
  }

  static referralCompleted(userId: string, referredUserId: string, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.REFERRAL,
      description: 'Referral completed',
      points,
      metadata: { referredUserId },
    });
  }

  static challengeCompleted(userId: string, challengeName: string, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.CHALLENGE,
      description: `Challenge completed: ${challengeName}`,
      points,
      metadata: { challengeName },
    });
  }

  static recyclingMilestone(userId: string, weight: number, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.RECYCLING,
      description: `Recycling milestone: ${weight}kg recycled`,
      points,
      metadata: { weight },
    });
  }

  static levelUp(userId: string, newLevel: number, points: number): RewardActivity {
    return this.create({
      userId,
      type: RewardActivityType.LEVEL_UP,
      description: `Level up! Now level ${newLevel}`,
      points,
      metadata: { newLevel },
    });
  }
}
