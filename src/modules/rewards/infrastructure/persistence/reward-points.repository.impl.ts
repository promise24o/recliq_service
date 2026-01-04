import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardPointsDocument } from './reward-points.model';
import { RewardPoints } from '../../domain/entities/reward-points.entity';
import { IRewardPointsRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class RewardPointsRepositoryImpl implements IRewardPointsRepository {
  constructor(
    @InjectModel(RewardPointsDocument.name)
    private readonly rewardPointsModel: Model<RewardPointsDocument>,
  ) {}

  async findByUserId(userId: string): Promise<RewardPoints | null> {
    const document = await this.rewardPointsModel.findOne({ userId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(rewardPoints: RewardPoints): Promise<RewardPoints> {
    const document = await this.rewardPointsModel.findOneAndUpdate(
      { userId: rewardPoints.userId },
      {
        userId: rewardPoints.userId,
        totalPoints: rewardPoints.totalPoints,
        currentLevel: rewardPoints.currentLevel,
        pointsToNextLevel: rewardPoints.pointsToNextLevel,
        updatedAt: rewardPoints.updatedAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(userId: string): Promise<RewardPoints> {
    const rewardPoints = RewardPoints.create(userId);
    const document = new this.rewardPointsModel({
      userId: rewardPoints.userId,
      totalPoints: rewardPoints.totalPoints,
      currentLevel: rewardPoints.currentLevel,
      pointsToNextLevel: rewardPoints.pointsToNextLevel,
      updatedAt: rewardPoints.updatedAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getTopUsers(limit: number): Promise<RewardPoints[]> {
    const documents = await this.rewardPointsModel
      .find()
      .sort({ totalPoints: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(document: RewardPointsDocument): RewardPoints {
    return new RewardPoints(
      document.userId,
      document.totalPoints,
      document.currentLevel,
      document.pointsToNextLevel,
      document.updatedAt,
    );
  }
}
