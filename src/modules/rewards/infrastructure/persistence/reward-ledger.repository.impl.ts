import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardLedgerDocument } from './reward-ledger.model';
import { RewardLedger, RewardType } from '../../domain/entities/reward-ledger.entity';
import { IRewardLedgerRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class RewardLedgerRepositoryImpl implements IRewardLedgerRepository {
  constructor(
    @InjectModel(RewardLedgerDocument.name)
    private readonly rewardLedgerModel: Model<RewardLedgerDocument>,
  ) {}

  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<RewardLedger[]> {
    const documents = await this.rewardLedgerModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findByUserIdAndType(userId: string, type: RewardType, limit: number = 20): Promise<RewardLedger[]> {
    const documents = await this.rewardLedgerModel
      .find({ userId, type })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findByReferenceId(referenceId: string): Promise<RewardLedger | null> {
    const document = await this.rewardLedgerModel.findOne({ referenceId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(rewardLedger: RewardLedger): Promise<RewardLedger> {
    const document = await this.rewardLedgerModel.findOneAndUpdate(
      { id: rewardLedger.id },
      {
        id: rewardLedger.id,
        userId: rewardLedger.userId,
        type: rewardLedger.type,
        points: rewardLedger.points,
        referenceId: rewardLedger.referenceId,
        description: rewardLedger.description,
        createdAt: rewardLedger.createdAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(rewardLedger: RewardLedger): Promise<RewardLedger> {
    const document = new this.rewardLedgerModel({
      id: rewardLedger.id,
      userId: rewardLedger.userId,
      type: rewardLedger.type,
      points: rewardLedger.points,
      referenceId: rewardLedger.referenceId,
      description: rewardLedger.description,
      createdAt: rewardLedger.createdAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getTotalPointsByUserId(userId: string): Promise<number> {
    const result = await this.rewardLedgerModel
      .aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ])
      .exec();

    return result.length > 0 ? result[0].total : 0;
  }

  async getRecentActivity(limit: number = 20): Promise<RewardLedger[]> {
    const documents = await this.rewardLedgerModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(document: RewardLedgerDocument): RewardLedger {
    return new RewardLedger(
      document._id.toString(),
      document.userId,
      document.type,
      document.points,
      document.referenceId,
      document.description,
      document.createdAt,
    );
  }
}
