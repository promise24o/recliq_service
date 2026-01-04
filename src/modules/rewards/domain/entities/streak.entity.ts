export class Streak {
  constructor(
    public readonly userId: string,
    public currentStreakCount: number = 0,
    public bestStreak: number = 0,
    public lastRecycleDate: Date | null = null,
    public streakInterval: number = 7, // weekly (in days)
    public isActive: boolean = false,
    public updatedAt: Date = new Date(),
  ) {}

  updateStreak(lastRecycleDate: Date): boolean {
    const today = new Date();
    const daysSinceLastRecycle = this.lastRecycleDate 
      ? Math.floor((today.getTime() - this.lastRecycleDate.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // If this is the first recycle or within the streak interval
    if (!this.lastRecycleDate || daysSinceLastRecycle <= this.streakInterval) {
      if (!this.lastRecycleDate || daysSinceLastRecycle > 0) {
        // Increment streak only if it's a new recycling day
        this.currentStreakCount++;
        this.isActive = true;
      }
      
      // Update best streak if current is better
      if (this.currentStreakCount > this.bestStreak) {
        this.bestStreak = this.currentStreakCount;
      }
      
      this.lastRecycleDate = lastRecycleDate;
      this.updatedAt = new Date();
      return true; // Streak maintained/extended
    } else {
      // Streak broken
      this.currentStreakCount = 1; // Start new streak from today
      this.lastRecycleDate = lastRecycleDate;
      this.isActive = true;
      this.updatedAt = new Date();
      return false; // Streak was broken and restarted
    }
  }

  checkStreakStatus(): { isActive: boolean; daysUntilBreak: number } {
    if (!this.lastRecycleDate || !this.isActive) {
      return { isActive: false, daysUntilBreak: 0 };
    }

    const today = new Date();
    const daysSinceLastRecycle = Math.floor((today.getTime() - this.lastRecycleDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilBreak = Math.max(0, this.streakInterval - daysSinceLastRecycle);

    return {
      isActive: daysSinceLastRecycle <= this.streakInterval,
      daysUntilBreak,
    };
  }

  getWeeklyActivity(): { [key: string]: boolean } {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const activity: { [key: string]: boolean } = {
      sun: false,
      mon: false,
      tue: false,
      wed: false,
      thu: false,
      fri: false,
      sat: false,
    };

    // For now, we'll mark today as active if there's a recent recycle
    // In a real implementation, this would track actual daily activity
    if (this.lastRecycleDate && this.isActive) {
      const daysSinceLastRecycle = Math.floor((today.getTime() - this.lastRecycleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastRecycle < 7) {
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        activity[dayNames[today.getDay()]] = true;
      }
    }

    return activity;
  }

  static create(userId: string): Streak {
    return new Streak(userId);
  }
}
