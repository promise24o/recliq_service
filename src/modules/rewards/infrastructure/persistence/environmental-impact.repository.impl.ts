import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnvironmentalImpactDocument } from './environmental-impact.model';
import { EnvironmentalImpact } from '../../domain/entities/environmental-impact.entity';
import { IEnvironmentalImpactRepository } from '../../domain/repositories/reward.repository';

@Injectable()
export class EnvironmentalImpactRepositoryImpl implements IEnvironmentalImpactRepository {
  constructor(
    @InjectModel(EnvironmentalImpactDocument.name)
    private readonly environmentalImpactModel: Model<EnvironmentalImpactDocument>,
  ) {}

  async findByUserId(userId: string): Promise<EnvironmentalImpact | null> {
    const document = await this.environmentalImpactModel.findOne({ userId }).exec();
    if (!document) return null;

    return this.mapToEntity(document);
  }

  async save(impact: EnvironmentalImpact): Promise<EnvironmentalImpact> {
    const document = await this.environmentalImpactModel.findOneAndUpdate(
      { userId: impact.userId },
      {
        userId: impact.userId,
        totalKgRecycled: impact.totalKgRecycled,
        co2SavedKg: impact.co2SavedKg,
        treesEquivalent: impact.treesEquivalent,
        carbonScore: impact.carbonScore,
        lastUpdatedAt: impact.lastUpdatedAt,
      },
      { upsert: true, new: true },
    ).exec();

    return this.mapToEntity(document);
  }

  async create(userId: string): Promise<EnvironmentalImpact> {
    const impact = EnvironmentalImpact.create(userId);
    const document = new this.environmentalImpactModel({
      userId: impact.userId,
      totalKgRecycled: impact.totalKgRecycled,
      co2SavedKg: impact.co2SavedKg,
      treesEquivalent: impact.treesEquivalent,
      carbonScore: impact.carbonScore,
      lastUpdatedAt: impact.lastUpdatedAt,
    });

    const savedDocument = await document.save();
    return this.mapToEntity(savedDocument);
  }

  async getTopImpact(limit: number): Promise<EnvironmentalImpact[]> {
    const documents = await this.environmentalImpactModel
      .find()
      .sort({ totalKgRecycled: -1 })
      .limit(limit)
      .exec();

    return documents.map(doc => this.mapToEntity(doc));
  }

  async getTotalImpact(): Promise<{ totalKg: number; totalCO2: number; totalTrees: number }> {
    const result = await this.environmentalImpactModel
      .aggregate([
        {
          $group: {
            _id: null,
            totalKg: { $sum: '$totalKgRecycled' },
            totalCO2: { $sum: '$co2SavedKg' },
            totalTrees: { $sum: '$treesEquivalent' },
          },
        },
      ])
      .exec();

    return result.length > 0 
      ? { totalKg: result[0].totalKg, totalCO2: result[0].totalCO2, totalTrees: result[0].totalTrees }
      : { totalKg: 0, totalCO2: 0, totalTrees: 0 };
  }

  private mapToEntity(document: EnvironmentalImpactDocument): EnvironmentalImpact {
    return new EnvironmentalImpact(
      document.userId,
      document.totalKgRecycled,
      document.co2SavedKg,
      document.treesEquivalent,
      document.carbonScore,
      document.lastUpdatedAt,
    );
  }
}
