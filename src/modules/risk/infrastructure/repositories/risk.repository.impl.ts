import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IRiskRepository } from '../../domain/repositories/risk.repository';
import { RiskEvent, RiskEventType, RiskState } from '../../domain/types/risk.types';

@Injectable()
export class RiskRepositoryImpl implements IRiskRepository {
  constructor(
    @InjectModel('RiskEvent') private readonly riskEventModel: Model<RiskEvent>,
  ) {}

  async createRiskEvent(riskEvent: RiskEvent): Promise<void> {
    const newRiskEvent = new this.riskEventModel(riskEvent);
    await newRiskEvent.save();
  }

  async getRiskEventsByUserId(userId: string): Promise<RiskEvent[]> {
    return this.riskEventModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getAllRiskEvents(): Promise<RiskEvent[]> {
    return this.riskEventModel
      .find({})
      .sort({ timestamp: -1 })
      .exec();
  }

  async getRiskEventsByType(type: RiskEventType): Promise<RiskEvent[]> {
    return this.riskEventModel
      .find({ type })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getRiskEventsByDateRange(startDate: Date, endDate: Date): Promise<RiskEvent[]> {
    return this.riskEventModel
      .find({
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  async updateRiskEvent(id: string, updates: Partial<RiskEvent>): Promise<RiskEvent | null> {
    return this.riskEventModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async deleteRiskEvent(id: string): Promise<void> {
    await this.riskEventModel.findByIdAndDelete(id).exec();
  }

  async getRiskUsersByState(riskState: RiskState): Promise<string[]> {
    // This is a complex query that would require aggregation
    // For now, return empty array - would need to implement based on current risk state logic
    return [];
  }

  async getExpiringSuspensions(days: number): Promise<RiskEvent[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.riskEventModel
      .find({
        type: RiskEventType.SUSPEND,
        expires: {
          $gte: new Date(),
          $lte: futureDate,
        },
        resolved: { $ne: true },
      })
      .sort({ expires: 1 })
      .exec();
  }
}
