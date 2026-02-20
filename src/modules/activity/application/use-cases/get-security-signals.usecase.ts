import { Injectable, Inject } from '@nestjs/common';
import type { ISecuritySignalRepository } from '../../domain/repositories/security-signal.repository';
import { SecuritySignalFilter } from '../../domain/types/activity.types';

@Injectable()
export class GetSecuritySignalsUseCase {
  constructor(
    @Inject('ISecuritySignalRepository')
    private readonly securitySignalRepository: ISecuritySignalRepository,
  ) {}

  async execute(filter: SecuritySignalFilter, includeAcknowledged = false) {
    // Convert string dates to Date objects if needed
    const processedFilter = { ...filter };
    if (typeof filter.dateFrom === 'string') {
      processedFilter.dateFrom = new Date(filter.dateFrom);
    }
    if (typeof filter.dateTo === 'string') {
      processedFilter.dateTo = new Date(filter.dateTo);
    }
    
    // If userId is provided, use that specific filter
    if (processedFilter.userId) {
      const signals = await this.securitySignalRepository.findByFilter({
        ...processedFilter,
        acknowledged: processedFilter.acknowledged
      });

      // Transform to DTO format
      return signals.map(signal => ({
        id: signal._id.toString(),
        userId: signal.userId,
        type: signal.type,
        severity: signal.severity,
        title: signal.title,
        description: signal.description,
        timestamp: signal.timestamp.toISOString(),
        acknowledged: signal.acknowledged,
        acknowledgedAt: signal.acknowledgedAt ? signal.acknowledgedAt.toISOString() : undefined,
        metadata: signal.metadata
      }));
    }

    // Otherwise use the simple findByUser method
    const signals = await this.securitySignalRepository.findByUser(
      filter.userId || '',
      includeAcknowledged
    );

    // Transform to DTO format
    return signals.map(signal => ({
      id: signal._id.toString(),
      userId: signal.userId,
      type: signal.type,
      severity: signal.severity,
      title: signal.title,
      description: signal.description,
      timestamp: signal.timestamp.toISOString(),
      acknowledged: signal.acknowledged,
      acknowledgedAt: signal.acknowledgedAt ? signal.acknowledgedAt.toISOString() : undefined,
      metadata: signal.metadata
    }));
  }
}
