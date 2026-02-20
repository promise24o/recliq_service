import { Injectable, Inject } from '@nestjs/common';
import type { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import { ActivitySummary } from '../../domain/types/activity.types';

@Injectable()
export class GetActivitySummaryUseCase {
  constructor(
    @Inject('IActivityLogRepository')
    private readonly activityLogRepository: IActivityLogRepository,
  ) {}

  async execute(userId: string): Promise<ActivitySummary> {
    return this.activityLogRepository.getActivitySummary(userId);
  }
}
