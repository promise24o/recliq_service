import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StreakDocument } from './streak.model';
import { Streak } from '../../domain/entities/streak.entity';
import { IStreakRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class StreakRepositoryImpl implements IStreakRepository {
  constructor(
    @InjectModel(StreakDocument.name)
    private readonly streakModel: Model<StreakDocument>,
  ) {}

  async findByUserId(userId: string): Promise<Streak | null> {
    const document = await this.streakModel.findOne({ userId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(streak: Streak): Promise<Streak> {
    const document = await this.streakModel.findOneAndUpdate(
      { userId: streak.userId },
      {
        userId: streak.userId,
        currentStreakCount: streak.currentStreakCount,
        bestStreak: streak.bestStreak,
        lastRecycleDate: streak.lastRecycleDate,
        streakInterval: streak.streakInterval,
        isActive: streak.isActive,
        updatedAt: streak.updatedAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(userId: string): Promise<Streak> {
    const streak = Streak.create(userId);
    const document = new this.streakModel({
      userId: streak.userId,
      currentStreakCount: streak.currentStreakCount,
      bestStreak: streak.bestStreak,
      lastRecycleDate: streak.lastRecycleDate,
      streakInterval: streak.streakInterval,
      isActive: streak.isActive,
      updatedAt: streak.updatedAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getTopStreaks(limit: number): Promise<Streak[]> {
    const documents = await this.streakModel
      .find({ isActive: true })
      .sort({ currentStreakCount: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async getActiveStreaks(): Promise<Streak[]> {
    const documents = await this.streakModel
      .find({ isActive: true })
      .sort({ currentStreakCount: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(document: StreakDocument): Streak {
    return new Streak(
      document.userId,
      document.currentStreakCount,
      document.bestStreak,
      document.lastRecycleDate,
      document.streakInterval,
      document.isActive,
      document.updatedAt,
    );
  }
}
