import { Injectable, Inject } from '@nestjs/common';
import type { IEnvironmentalImpactRepository } from '../../domain/repositories/reward.repository';
import { EnvironmentalImpact } from '../../domain/entities/environmental-impact.entity';

export interface EnvironmentalImpactResponse {
  wasteRecycledKg: number;
  co2SavedKg: number;
  treesEquivalent: number;
  carbonScore: string;
  waterSaved: number;
  energySaved: number;
  landfillSpaceSaved: number;
}

@Injectable()
export class GetEnvironmentalImpactUseCase {
  constructor(
    @Inject('IEnvironmentalImpactRepository')
    private readonly environmentalImpactRepository: IEnvironmentalImpactRepository,
  ) {}

  async execute(userId: string): Promise<EnvironmentalImpactResponse> {
    let impact = await this.environmentalImpactRepository.findByUserId(userId);
    
    // Create if doesn't exist
    if (!impact) {
      impact = await this.environmentalImpactRepository.create(userId);
    }

    return {
      wasteRecycledKg: Math.round(impact.totalKgRecycled * 10) / 10, // Round to 1 decimal place
      co2SavedKg: Math.round(impact.co2SavedKg * 10) / 10,
      treesEquivalent: impact.treesEquivalent,
      carbonScore: impact.carbonScore,
      waterSaved: impact.getWaterSaved(),
      energySaved: impact.getEnergySaved(),
      landfillSpaceSaved: impact.getLandfillSpaceSaved(),
    };
  }
}
