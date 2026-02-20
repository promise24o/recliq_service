import { Injectable, Inject } from '@nestjs/common';
import type { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import { ActivityFilter } from '../../domain/types/activity.types';

@Injectable()
export class GetActivityLogsUseCase {
  constructor(
    @Inject('IActivityLogRepository')
    private readonly activityLogRepository: IActivityLogRepository,
  ) {}

  async execute(filter: ActivityFilter, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    // Convert string dates to Date objects if needed
    const processedFilter = { ...filter };
    if (typeof filter.dateFrom === 'string') {
      processedFilter.dateFrom = new Date(filter.dateFrom);
    }
    if (typeof filter.dateTo === 'string') {
      processedFilter.dateTo = new Date(filter.dateTo);
    }
    
    const [logs, total] = await Promise.all([
      this.activityLogRepository.findByFilter(processedFilter, limit, skip),
      this.activityLogRepository.countByFilter(processedFilter),
    ]);

    // Transform to DTO format
    const events = logs.map(log => ({
      id: log._id.toString(),
      userId: log.userId,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      actionLabel: log.actionLabel,
      description: log.description,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      outcome: log.outcome,
      riskLevel: log.riskLevel,
      source: log.source,
      ipAddress: log.ipAddress,
      device: log.device,
      location: log.location,
      beforeState: log.beforeState,
      afterState: log.afterState,
      reason: log.reason,
      auditRef: log.auditRef,
    }));

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    };
  }
}
