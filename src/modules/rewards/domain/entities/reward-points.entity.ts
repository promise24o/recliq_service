export class RewardPoints {
  constructor(
    public readonly userId: string,
    public totalPoints: number = 0,
    public currentLevel: number = 1,
    public pointsToNextLevel: number = 500,
    public updatedAt: Date = new Date(),
  ) {}

  addPoints(points: number): void {
    this.totalPoints += points;
    this.updateLevel();
    this.updatedAt = new Date();
  }

  private updateLevel(): void {
    // Level rules: Recycler (0-499), Eco  Hero (500-1999), Green Champion (2000+)
    if (this.totalPoints >= 2000) {
      this.currentLevel = 3;
      this.pointsToNextLevel = 0; // Max level
    } else if (this.totalPoints >= 500) {
      this.currentLevel = 2;
      this.pointsToNextLevel = 2000 - this.totalPoints;
    } else {
      this.currentLevel = 1;
      this.pointsToNextLevel = 500 - this.totalPoints;
    }
  }

  getLevelName(): string {
    switch (this.currentLevel) {
      case 1:
        return 'Recycler';
      case 2:
        return 'Eco Hero';
      case 3:
        return 'Green Champion';
      default:
        return 'Recycler';
    }
  }

  getLevelProgressPercent(): number {
    if (this.currentLevel === 3) return 100; // Max level
    
    const levelStartPoints = this.currentLevel === 1 ? 0 : 500;
    const levelEndPoints = this.currentLevel === 1 ? 500 : 2000;
    const levelRange = levelEndPoints - levelStartPoints;
    const progressInLevel = this.totalPoints - levelStartPoints;
    
    return Math.round((progressInLevel / levelRange) * 100);
  }

  static create(userId: string): RewardPoints {
    return new RewardPoints(userId);
  }
}
