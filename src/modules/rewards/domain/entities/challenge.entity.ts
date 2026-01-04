export enum ChallengeGoalType {
  KG = 'kg',
  PICKUPS = 'pickups',
  REFERRALS = 'referrals',
}

export class Challenge {
  constructor(
    public readonly challengeId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly goalType: ChallengeGoalType,
    public readonly targetValue: number,
    public readonly rewardPoints: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly isActive: boolean = true,
  ) {}

  isCurrentlyActive(): boolean {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
  }

  getDaysRemaining(): number {
    const now = new Date();
    if (now > this.endDate) return 0;
    
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  getProgressPercent(currentProgress: number): number {
    return Math.min(100, Math.round((currentProgress / this.targetValue) * 100));
  }

  isCompleted(currentProgress: number): boolean {
    return currentProgress >= this.targetValue;
  }

  // Factory methods for common challenge types
  static createWeeklyWeightChallenge(targetKg: number, rewardPoints: number): Challenge {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7); // End of week
    
    return new Challenge(
      `weekly_${targetKg}kg`,
      `Recycle ${targetKg}kg this week`,
      `Recycle a total of ${targetKg}kg of waste within this week`,
      ChallengeGoalType.KG,
      targetKg,
      rewardPoints,
      startDate,
      endDate,
    );
  }

  static createWeeklyPickupChallenge(targetPickups: number, rewardPoints: number): Challenge {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    return new Challenge(
      `weekly_${targetPickups}_pickups`,
      `${targetPickups} pickups this week`,
      `Complete ${targetPickups} successful recycling pickups this week`,
      ChallengeGoalType.PICKUPS,
      targetPickups,
      rewardPoints,
      startDate,
      endDate,
    );
  }

  static createMonthlyChallenge(targetKg: number, rewardPoints: number): Challenge {
    const startDate = new Date();
    startDate.setDate(1); // First day of current month
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    endDate.setDate(0); // Last day of current month
    
    return new Challenge(
      `monthly_${targetKg}kg`,
      `Recycle ${targetKg}kg this month`,
      `Recycle a total of ${targetKg}kg of waste this month`,
      ChallengeGoalType.KG,
      targetKg,
      rewardPoints,
      startDate,
      endDate,
    );
  }

  static createReferralChallenge(targetReferrals: number, rewardPoints: number): Challenge {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1); // 1 month from now
    
    return new Challenge(
      `referral_${targetReferrals}`,
      `${targetReferrals} successful referrals`,
      `Get ${targetReferrals} friends to complete their first recycling pickup`,
      ChallengeGoalType.REFERRALS,
      targetReferrals,
      rewardPoints,
      startDate,
      endDate,
    );
  }

  // Factory method to create all default challenges
  static createDefaultChallenges(): Challenge[] {
    const now = new Date();
    const challenges: Challenge[] = [
      this.createWeeklyWeightChallenge(10, 50),
      this.createWeeklyWeightChallenge(25, 100),
      this.createWeeklyPickupChallenge(3, 30),
      this.createWeeklyPickupChallenge(5, 75),
      this.createMonthlyChallenge(50, 200),
      this.createMonthlyChallenge(100, 500),
      this.createReferralChallenge(2, 100),
      this.createReferralChallenge(5, 400),
    ];

    return challenges.filter(challenge => challenge.isCurrentlyActive());
  }
}

export class UserChallengeProgress {
  constructor(
    public readonly userId: string,
    public readonly challengeId: string,
    public currentProgress: number = 0,
    public completed: boolean = false,
    public completedAt: Date | null = null,
    public updatedAt: Date = new Date(),
  ) {}

  updateProgress(newProgress: number): void {
    this.currentProgress = newProgress;
    this.updatedAt = new Date();
  }

  markCompleted(): void {
    this.completed = true;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  static create(userId: string, challengeId: string): UserChallengeProgress {
    return new UserChallengeProgress(userId, challengeId);
  }
}
