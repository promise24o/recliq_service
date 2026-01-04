export interface BadgeCriteria {
  type: 'FIRST_RECYCLE' | 'WEIGHT_THRESHOLD' | 'PICKUP_COUNT' | 'STREAK_WEEKS' | 'REFERRAL_COUNT';
  value: number;
}

export class Badge {
  constructor(
    public readonly badgeId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly criteria: BadgeCriteria,
    public readonly icon: string,
    public readonly isActive: boolean = true,
  ) {}

  static createFirstRecycleBadge(): Badge {
    return new Badge(
      'first_recycle',
      'First Recycle',
      'Complete your first successful recycling pickup',
      { type: 'FIRST_RECYCLE', value: 1 },
      '🌱',
    );
  }

  static createWeightBadge(kg: number): Badge {
    return new Badge(
      `weight_${kg}kg`,
      `${kg}kg Recycled`,
      `Recycle a total of ${kg}kg of waste`,
      { type: 'WEIGHT_THRESHOLD', value: kg },
      '⚖️',
    );
  }

  static createPickupBadge(count: number): Badge {
    return new Badge(
      `pickup_${count}`,
      `${count} Pickups`,
      `Complete ${count} successful recycling pickups`,
      { type: 'PICKUP_COUNT', value: count },
      '🚚',
    );
  }

  static createStreakBadge(weeks: number): Badge {
    return new Badge(
      `streak_${weeks}_weeks`,
      `${weeks}-Week Streak`,
      `Maintain a recycling streak for ${weeks} consecutive weeks`,
      { type: 'STREAK_WEEKS', value: weeks },
      '🔥',
    );
  }

  static createReferralBadge(count: number): Badge {
    return new Badge(
      `referral_${count}`,
      `${count} Referrals`,
      `Successfully refer ${count} friends who complete their first recycle`,
      { type: 'REFERRAL_COUNT', value: count },
      '👥',
    );
  }

  // Factory method to create all predefined badges
  static createAllBadges(): Badge[] {
    const badges: Badge[] = [
      this.createFirstRecycleBadge(),
      this.createWeightBadge(10),
      this.createWeightBadge(50),
      this.createWeightBadge(100),
      this.createPickupBadge(5),
      this.createPickupBadge(10),
      this.createPickupBadge(25),
      this.createStreakBadge(2),
      this.createStreakBadge(5),
      this.createStreakBadge(10),
      this.createReferralBadge(1),
      this.createReferralBadge(3),
      this.createReferralBadge(5),
    ];

    return badges;
  }
}

export class UserBadge {
  constructor(
    public readonly userId: string,
    public readonly badgeId: string,
    public readonly earnedAt: Date,
    public readonly sourceEventId: string, // The ledger entry that triggered this badge
  ) {}

  static create(data: {
    userId: string;
    badgeId: string;
    sourceEventId: string;
  }): UserBadge {
    return new UserBadge(
      data.userId,
      data.badgeId,
      new Date(),
      data.sourceEventId,
    );
  }
}
