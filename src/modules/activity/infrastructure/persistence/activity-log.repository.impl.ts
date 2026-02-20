import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import { ActivityLogDocument, ActivityLogSchema } from './activity-log.model';
import { ActivityEvent, ActivityFilter, ActivitySummary } from '../../domain/types/activity.types';

@Injectable()
export class ActivityLogRepositoryImpl implements IActivityLogRepository {
  constructor(
    @InjectModel('ActivityLog')
    private readonly activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async create(activityLog: Partial<ActivityLogDocument>): Promise<ActivityLogDocument> {
    const newActivityLog = new this.activityLogModel(activityLog);
    return newActivityLog.save();
  }

  async findById(id: string): Promise<ActivityLogDocument | null> {
    return this.activityLogModel.findById(id).exec();
  }

  async findByUser(userId: string, limit = 100): Promise<ActivityLogDocument[]> {
    return this.activityLogModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByFilter(filter: ActivityFilter, limit = 100, skip = 0): Promise<ActivityLogDocument[]> {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.action) query.action = filter.action;
    if (filter.riskLevel) query.riskLevel = filter.riskLevel;
    if (filter.source) query.source = filter.source;
    if (filter.outcome) query.outcome = filter.outcome;
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.entityId) query.entityId = filter.entityId;

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      query.timestamp = {};
      if (filter.dateFrom) query.timestamp.$gte = filter.dateFrom;
      if (filter.dateTo) query.timestamp.$lte = filter.dateTo;
    }

    return this.activityLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByFilter(filter: ActivityFilter): Promise<number> {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.action) query.action = filter.action;
    if (filter.riskLevel) query.riskLevel = filter.riskLevel;
    if (filter.source) query.source = filter.source;
    if (filter.outcome) query.outcome = filter.outcome;
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.entityId) query.entityId = filter.entityId;

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      query.timestamp = {};
      if (filter.dateFrom) query.timestamp.$gte = filter.dateFrom;
      if (filter.dateTo) query.timestamp.$lte = filter.dateTo;
    }

    return this.activityLogModel.countDocuments(query).exec();
  }

  async getActivitySummary(userId: string): Promise<ActivitySummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent logins count
    const recentLogins = await this.activityLogModel.countDocuments({
      userId,
      action: 'login',
      timestamp: { $gte: thirtyDaysAgo },
    }).exec();

    // Get actions performed count (excluding logins/logouts)
    const actionsPerformed = await this.activityLogModel.countDocuments({
      userId,
      action: { 
        $nin: ['login', 'logout', 'failed_login'] 
      },
      timestamp: { $gte: thirtyDaysAgo },
    }).exec();

    // Get sensitive actions count (high and critical risk)
    const sensitiveActions = await this.activityLogModel.countDocuments({
      userId,
      riskLevel: { $in: ['high', 'critical'] },
      timestamp: { $gte: thirtyDaysAgo },
    }).exec();

    // Get distinct locations
    const locations = await this.getDistinctLocations(userId);

    // Get last activity time
    const lastActivity = await this.getLastActivity(userId);
    const lastActivityTime = lastActivity ? lastActivity.timestamp.toISOString() : new Date().toISOString();

    return {
      recentLogins,
      actionsPerformed,
      sensitiveActions,
      distinctLocations: locations.length,
      lastActivityTime,
    };
  }

  async getDistinctLocations(userId: string): Promise<string[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.activityLogModel.distinct('location', {
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    }).exec();

    return result;
  }

  async getLastActivity(userId: string): Promise<ActivityLogDocument | null> {
    return this.activityLogModel
      .findOne({ userId })
      .sort({ timestamp: -1 })
      .exec();
  }
}
