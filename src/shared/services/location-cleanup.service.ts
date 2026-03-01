import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LocationTrackingService } from './location-tracking.service';

@Injectable()
export class LocationCleanupService {
  private readonly logger = new Logger(LocationCleanupService.name);

  constructor(
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStaleAgentCleanup() {
    const removedCount = await this.locationTrackingService.removeStaleAgents();
    if (removedCount > 0) {
      this.logger.log(`Cleanup: Removed ${removedCount} stale agent(s) from live tracking`);
    }
  }
}
