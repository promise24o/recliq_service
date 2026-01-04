import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardActivityDocument } from './reward-activity.model';
import { RewardActivity, RewardActivityType } from '../../domain/entities/reward-activity.entity';
import { IRewardActivityRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class RewardActivityRepositoryImpl implements IRewardActivityRepository {
  constructor(
    @InjectModel('RewardActivityDocument')
    private readonly rewardActivityModel: Model<RewardActivityDocument>,
  ) {}

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<RewardActivity[]> {
    const docs = await this.rewardActivityModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
    
    return docs.map(doc => this.toEntity(doc));
  }

  async create(activity: RewardActivity): Promise<RewardActivity> {
    const doc = this.toDocument(activity);
    const saved = await new this.rewardActivityModel(doc).save();
    return this.toEntity(saved);
  }

  async findByType(userId: string, type: RewardActivityType): Promise<RewardActivity[]> {
    const docs = await this.rewardActivityModel
      .find({ userId, type })
      .sort({ createdAt: -1 })
      .exec();
    
    return docs.map(doc => this.toEntity(doc));
  }

  async countByUserId(userId: string): Promise<number> {
    return this.rewardActivityModel.countDocuments({ userId });
  }

  private toEntity(doc: RewardActivityDocument): RewardActivity {
    return new RewardActivity(
      doc._id.toString(),
      doc.userId,
      doc.type,
      doc.description,
      doc.points,
      doc.metadata || {},
      doc.createdAt,
    );
  }

  private toDocument(activity: RewardActivity): any {
    return {
      userId: activity.userId,
      type: activity.type,
      description: activity.description,
      points: activity.points,
      metadata: activity.metadata || {},
      createdAt: activity.createdAt,
    };
  }
}
