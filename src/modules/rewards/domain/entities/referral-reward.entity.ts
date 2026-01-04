export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REDEEMED = 'redeemed',
}

export class ReferralReward {
  constructor(
    public readonly id: string,
    public readonly referrerUserId: string,
    public readonly referredUserId: string,
    public status: ReferralStatus = ReferralStatus.PENDING,
    public pointsAwarded: number = 0,
    public completedAt: Date | null = null,
    public createdAt: Date = new Date(),
  ) {}

  markCompleted(pointsAwarded: number): void {
    this.status = ReferralStatus.COMPLETED;
    this.pointsAwarded = pointsAwarded;
    this.completedAt = new Date();
  }

  markCancelled(): void {
    this.status = ReferralStatus.CANCELLED;
    this.pointsAwarded = 0;
    this.completedAt = null;
  }

  markRedeemed(): void {
    this.status = ReferralStatus.REDEEMED;
  }

  isPending(): boolean {
    return this.status === ReferralStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === ReferralStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === ReferralStatus.CANCELLED;
  }

  isRedeemed(): boolean {
    return this.status === ReferralStatus.REDEEMED;
  }

  // Factory method for creating new referral
  static create(data: {
    id: string;
    referrerUserId: string;
    referredUserId: string;
  }): ReferralReward {
    return new ReferralReward(
      data.id,
      data.referrerUserId,
      data.referredUserId,
      ReferralStatus.PENDING,
      0,
      null,
      new Date(),
    );
  }

  // Factory method for creating completed referral (when referral condition is met)
  static createCompleted(data: {
    id: string;
    referrerUserId: string;
    referredUserId: string;
    pointsAwarded: number;
  }): ReferralReward {
    const referral = new ReferralReward(
      data.id,
      data.referrerUserId,
      data.referredUserId,
      ReferralStatus.COMPLETED,
      data.pointsAwarded,
      new Date(),
      new Date(),
    );
    return referral;
  }
}
