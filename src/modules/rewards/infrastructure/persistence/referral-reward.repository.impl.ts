import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReferralRewardDocument } from './referral-reward.model';
import { ReferralReward, ReferralStatus } from '../../domain/entities/referral-reward.entity';
import { IReferralRewardRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class ReferralRewardRepositoryImpl implements IReferralRewardRepository {
  constructor(
    @InjectModel(ReferralRewardDocument.name)
    private readonly referralRewardModel: Model<ReferralRewardDocument>,
  ) {}

  async findByReferrerId(referrerUserId: string): Promise<ReferralReward[]> {
    const documents = await this.referralRewardModel
      .find({ referrerUserId })
      .sort({ createdAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findByReferredId(referredUserId: string): Promise<ReferralReward | null> {
    const document = await this.referralRewardModel.findOne({ referredUserId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async findById(id: string): Promise<ReferralReward | null> {
    const document = await this.referralRewardModel.findOne({ id }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(referral: ReferralReward): Promise<ReferralReward> {
    const document = await this.referralRewardModel.findOneAndUpdate(
      { id: referral.id },
      {
        id: referral.id,
        referrerUserId: referral.referrerUserId,
        referredUserId: referral.referredUserId,
        status: referral.status,
        pointsAwarded: referral.pointsAwarded,
        completedAt: referral.completedAt,
        createdAt: referral.createdAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(referral: ReferralReward): Promise<ReferralReward> {
    const document = new this.referralRewardModel({
      id: referral.id,
      referrerUserId: referral.referrerUserId,
      referredUserId: referral.referredUserId,
      status: referral.status,
      pointsAwarded: referral.pointsAwarded,
      completedAt: referral.completedAt,
      createdAt: referral.createdAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async findByStatus(status: ReferralStatus): Promise<ReferralReward[]> {
    const documents = await this.referralRewardModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async getReferralStats(userId: string): Promise<{ total: number; completed: number; points: number }> {
    const result = await this.referralRewardModel
      .aggregate([
        { $match: { referrerUserId: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            points: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$pointsAwarded', 0] },
            },
          },
        },
      ])
      .exec();

    return result.length > 0 
      ? { total: result[0].total, completed: result[0].completed, points: result[0].points }
      : { total: 0, completed: 0, points: 0 };
  }

  private mapToEntity(document: ReferralRewardDocument): ReferralReward {
    return new ReferralReward(
      document.id,
      document.referrerUserId,
      document.referredUserId,
      document.status,
      document.pointsAwarded,
      document.completedAt,
      document.createdAt,
    );
  }
}
