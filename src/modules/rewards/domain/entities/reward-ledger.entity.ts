export enum RewardType {
  RECYCLE = 'RECYCLE',
  STREAK = 'STREAK',
  BADGE = 'BADGE',
  CHALLENGE = 'CHALLENGE',
  REFERRAL = 'REFERRAL',
  BONUS = 'BONUS',
}

export class RewardLedger {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: RewardType,
    public readonly points: number,
    public readonly referenceId: string, // pickupId, referralId, etc.
    public readonly description: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(data: {
    id: string;
    userId: string;
    type: RewardType;
    points: number;
    referenceId: string;
    description: string;
  }): RewardLedger {
    return new RewardLedger(
      data.id,
      data.userId,
      data.type,
      data.points,
      data.referenceId,
      data.description,
      new Date(),
    );
  }

  // Factory methods for common reward types
  static createRecycleReward(data: {
    id: string;
    userId: string;
    points: number;
    pickupId: string;
    weight: number;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.RECYCLE,
      points: data.points,
      referenceId: data.pickupId,
      description: `Recycled ${data.weight}kg of waste`,
    });
  }

  static createStreakReward(data: {
    id: string;
    userId: string;
    points: number;
    streakWeeks: number;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.STREAK,
      points: data.points,
      referenceId: `streak_${data.streakWeeks}`,
      description: `Weekly streak maintained (${data.streakWeeks} weeks)`,
    });
  }

  static createBadgeReward(data: {
    id: string;
    userId: string;
    points: number;
    badgeId: string;
    badgeName: string;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.BADGE,
      points: data.points,
      referenceId: data.badgeId,
      description: `Badge earned: ${data.badgeName}`,
    });
  }

  static createChallengeReward(data: {
    id: string;
    userId: string;
    points: number;
    challengeId: string;
    challengeTitle: string;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.CHALLENGE,
      points: data.points,
      referenceId: data.challengeId,
      description: `Challenge completed: ${data.challengeTitle}`,
    });
  }

  static createReferralReward(data: {
    id: string;
    userId: string;
    points: number;
    referredUserId: string;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.REFERRAL,
      points: data.points,
      referenceId: data.referredUserId,
      description: 'Successful referral reward',
    });
  }

  static createBonusReward(data: {
    id: string;
    userId: string;
    points: number;
    reason: string;
  }): RewardLedger {
    return RewardLedger.create({
      id: data.id,
      userId: data.userId,
      type: RewardType.BONUS,
      points: data.points,
      referenceId: `bonus_${Date.now()}`,
      description: data.reason,
    });
  }
}
