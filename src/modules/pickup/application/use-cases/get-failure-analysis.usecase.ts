import { Injectable, Inject } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { FailureAnalysis } from '../../domain/types/pickup.types';

@Injectable()
export class GetFailureAnalysisUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(filters?: { city?: string; timeRange?: string }): Promise<FailureAnalysis> {
    return this.pickupRepository.getFailureAnalysis(filters);
  }
}
