import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ISecuritySignalRepository } from '../../domain/repositories/security-signal.repository';
import { SecuritySignalDocument } from './security-signal.model';
import { SecuritySignalFilter } from '../../domain/types/activity.types';

@Injectable()
export class SecuritySignalRepositoryImpl implements ISecuritySignalRepository {
  constructor(
    @InjectModel('SecuritySignal')
    private readonly securitySignalModel: Model<SecuritySignalDocument>,
  ) {}

  async create(securitySignal: Partial<SecuritySignalDocument>): Promise<SecuritySignalDocument> {
    const newSecuritySignal = new this.securitySignalModel(securitySignal);
    return newSecuritySignal.save();
  }

  async findById(id: string): Promise<SecuritySignalDocument | null> {
    return this.securitySignalModel.findById(id).exec();
  }

  async findByUser(userId: string, includeAcknowledged = false): Promise<SecuritySignalDocument[]> {
    const query: any = { userId };
    
    if (!includeAcknowledged) {
      query.acknowledged = false;
    }
    
    return this.securitySignalModel
      .find(query)
      .sort({ severity: 1, timestamp: -1 }) // Critical first, then most recent
      .exec();
  }

  async findByFilter(filter: SecuritySignalFilter, limit = 100, skip = 0): Promise<SecuritySignalDocument[]> {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.type) query.type = filter.type;
    if (filter.severity) query.severity = filter.severity;
    if (filter.acknowledged !== undefined) query.acknowledged = filter.acknowledged;

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      query.timestamp = {};
      if (filter.dateFrom) query.timestamp.$gte = filter.dateFrom;
      if (filter.dateTo) query.timestamp.$lte = filter.dateTo;
    }

    return this.securitySignalModel
      .find(query)
      .sort({ severity: 1, timestamp: -1 }) // Critical first, then most recent
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByFilter(filter: SecuritySignalFilter): Promise<number> {
    const query: any = {};

    if (filter.userId) query.userId = filter.userId;
    if (filter.type) query.type = filter.type;
    if (filter.severity) query.severity = filter.severity;
    if (filter.acknowledged !== undefined) query.acknowledged = filter.acknowledged;

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      query.timestamp = {};
      if (filter.dateFrom) query.timestamp.$gte = filter.dateFrom;
      if (filter.dateTo) query.timestamp.$lte = filter.dateTo;
    }

    return this.securitySignalModel.countDocuments(query).exec();
  }

  async acknowledgeSignal(id: string): Promise<SecuritySignalDocument | null> {
    return this.securitySignalModel.findByIdAndUpdate(
      id,
      { 
        acknowledged: true,
        acknowledgedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async acknowledgeAllSignals(userId: string): Promise<number> {
    const result = await this.securitySignalModel.updateMany(
      { userId, acknowledged: false },
      { 
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    ).exec();

    return result.modifiedCount;
  }
}
