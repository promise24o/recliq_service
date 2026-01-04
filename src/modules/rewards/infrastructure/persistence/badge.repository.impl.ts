import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadgeDocument, UserBadgeDocument } from './badge.model';
import { Badge, UserBadge } from '../../domain/entities/badge.entity';
import { IBadgeRepository, IUserBadgeRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class BadgeRepositoryImpl implements IBadgeRepository {
  constructor(
    @InjectModel(BadgeDocument.name)
    private readonly badgeModel: Model<BadgeDocument>,
  ) {}

  async findAll(): Promise<Badge[]> {
    const documents = await this.badgeModel.find().exec();
    return documents.map(doc => this.mapToEntity(doc));
  }

  async findActive(): Promise<Badge[]> {
    const documents = await this.badgeModel.find({ isActive: true }).exec();
    return documents.map(doc => this.mapToEntity(doc));
  }

  async findById(badgeId: string): Promise<Badge | null> {
    const document = await this.badgeModel.findOne({ badgeId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async create(badge: Badge): Promise<Badge> {
    const newBadge = new this.badgeModel({
      badgeId: badge.badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteria: badge.criteria,
      isActive: badge.isActive,
    });

    const savedBadge = await newBadge.save();
    return this.mapToEntity(savedBadge);
  }

  async update(badge: Badge): Promise<Badge> {
    const updatedBadge = await this.badgeModel.findOneAndUpdate(
      { badgeId: badge.badgeId },
      {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        criteria: badge.criteria,
        isActive: badge.isActive,
      },
      { new: true }
    ).exec();

    if (!updatedBadge) {
      throw new Error(`Badge with ID ${badge.badgeId} not found`);
    }

    return this.mapToEntity(updatedBadge);
  }

  private mapToEntity(document: BadgeDocument): Badge {
    return new Badge(
      document.badgeId,
      document.name,
      document.description,
      document.criteria,
      document.icon,
      document.isActive,
    );
  }
}

@Injectable()
export class UserBadgeRepositoryImpl implements IUserBadgeRepository {
  constructor(
    @InjectModel(UserBadgeDocument.name)
    private readonly userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(BadgeDocument.name)
    private readonly badgeModel: Model<BadgeDocument>,
  ) {}

  async findByUserId(userId: string): Promise<UserBadge[]> {
    const documents = await this.userBadgeModel
      .find({ userId })
      .sort({ earnedAt: -1 })
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async findByUserIdAndBadgeId(userId: string, badgeId: string): Promise<UserBadge | null> {
    const document = await this.userBadgeModel.findOne({ userId, badgeId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(userBadge: UserBadge): Promise<UserBadge> {
    const document = await this.userBadgeModel.findOneAndUpdate(
      { userId: userBadge.userId, badgeId: userBadge.badgeId },
      {
        userId: userBadge.userId,
        badgeId: userBadge.badgeId,
        earnedAt: userBadge.earnedAt,
        sourceEventId: userBadge.sourceEventId,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(userBadge: UserBadge): Promise<UserBadge> {
    const document = new this.userBadgeModel({
      userId: userBadge.userId,
      badgeId: userBadge.badgeId,
      earnedAt: userBadge.earnedAt,
      sourceEventId: userBadge.sourceEventId,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getBadgeStats(userId: string): Promise<{ total: number; earned: number }> {
    const [total, earned] = await Promise.all([
      this.badgeModel.countDocuments({ isActive: true }),
      this.userBadgeModel.countDocuments({ userId }),
    ]);

    return { total, earned };
  }

  async findRecentBadges(limit: number = 10): Promise<UserBadge[]> {
    const documents = await this.userBadgeModel
      .find()
      .sort({ earnedAt: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  private mapToEntity(document: UserBadgeDocument): UserBadge {
    return new UserBadge(
      document.userId,
      document.badgeId,
      document.earnedAt,
      document.sourceEventId,
    );
  }
}
