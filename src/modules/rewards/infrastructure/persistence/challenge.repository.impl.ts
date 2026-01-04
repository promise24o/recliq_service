import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChallengeDocument, UserChallengeProgressDocument } from './challenge.model';
import { Challenge, UserChallengeProgress } from '../../domain/entities/challenge.entity';
import { IChallengeRepository, IUserChallengeProgressRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class ChallengeRepositoryImpl implements IChallengeRepository {
  constructor(
    @InjectModel(ChallengeDocument.name)
    private readonly challengeModel: Model<ChallengeDocument>,
  ) {}

  async findAll(): Promise<Challenge[]> {
    const documents = await this.challengeModel.find().exec();
    return documents.map(doc => this.mapToEntity(doc));
  }

  async findActive(): Promise<Challenge[]> {
    const now = new Date();
    const documents = await this.challengeModel.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findById(challengeId: string): Promise<Challenge | null> {
    const document = await this.challengeModel.findOne({ challengeId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(challenge: Challenge): Promise<Challenge> {
    const document = await this.challengeModel.findOneAndUpdate(
      { challengeId: challenge.challengeId },
      {
        challengeId: challenge.challengeId,
        title: challenge.title,
        description: challenge.description,
        goalType: challenge.goalType,
        targetValue: challenge.targetValue,
        rewardPoints: challenge.rewardPoints,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        isActive: challenge.isActive,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(challenge: Challenge): Promise<Challenge> {
    const document = new this.challengeModel({
      challengeId: challenge.challengeId,
      title: challenge.title,
      description: challenge.description,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      rewardPoints: challenge.rewardPoints,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      isActive: challenge.isActive,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  private mapToEntity(document: ChallengeDocument): Challenge {
    return new Challenge(
      document.challengeId,
      document.title,
      document.description,
      document.goalType,
      document.targetValue,
      document.rewardPoints,
      document.startDate,
      document.endDate,
      document.isActive,
    );
  }
}

@Injectable()
export class UserChallengeProgressRepositoryImpl implements IUserChallengeProgressRepository {
  constructor(
    @InjectModel(UserChallengeProgressDocument.name)
    private readonly userChallengeProgressModel: Model<UserChallengeProgressDocument>,
  ) {}

  async findByUserId(userId: string): Promise<UserChallengeProgress[]> {
    const documents = await this.userChallengeProgressModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findByUserIdAndChallengeId(userId: string, challengeId: string): Promise<UserChallengeProgress | null> {
    const document = await this.userChallengeProgressModel.findOne({ userId, challengeId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(progress: UserChallengeProgress): Promise<UserChallengeProgress> {
    const document = await this.userChallengeProgressModel.findOneAndUpdate(
      { userId: progress.userId, challengeId: progress.challengeId },
      {
        userId: progress.userId,
        challengeId: progress.challengeId,
        currentProgress: progress.currentProgress,
        completed: progress.completed,
        completedAt: progress.completedAt,
        updatedAt: progress.updatedAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(progress: UserChallengeProgress): Promise<UserChallengeProgress> {
    const document = new this.userChallengeProgressModel({
      userId: progress.userId,
      challengeId: progress.challengeId,
      currentProgress: progress.currentProgress,
      completed: progress.completed,
      completedAt: progress.completedAt,
      updatedAt: progress.updatedAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getActiveChallenges(userId: string): Promise<UserChallengeProgress[]> {
    const documents = await this.userChallengeProgressModel
      .find({ userId, completed: false })
      .sort({ updatedAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async getCompletedChallenges(userId: string): Promise<UserChallengeProgress[]> {
    const documents = await this.userChallengeProgressModel
      .find({ userId, completed: true })
      .sort({ completedAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(document: UserChallengeProgressDocument): UserChallengeProgress {
    return new UserChallengeProgress(
      document.userId,
      document.challengeId,
      document.currentProgress,
      document.completed,
      document.completedAt,
      document.updatedAt,
    );
  }
}
