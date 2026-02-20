import { ActivityLogDocument } from '../../infrastructure/persistence/activity-log.model';
import { ActivityEvent, ActivityFilter, ActivitySummary } from '../types/activity.types';

export interface IActivityLogRepository {
  create(activityLog: Partial<ActivityLogDocument>): Promise<ActivityLogDocument>;
  findById(id: string): Promise<ActivityLogDocument | null>;
  findByUser(userId: string, limit?: number): Promise<ActivityLogDocument[]>;
  findByFilter(filter: ActivityFilter, limit?: number, skip?: number): Promise<ActivityLogDocument[]>;
  countByFilter(filter: ActivityFilter): Promise<number>;
  getActivitySummary(userId: string): Promise<ActivitySummary>;
  getDistinctLocations(userId: string): Promise<string[]>;
  getLastActivity(userId: string): Promise<ActivityLogDocument | null>;
}
