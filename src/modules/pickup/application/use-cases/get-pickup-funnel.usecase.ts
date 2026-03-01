import { Injectable, Inject } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { FunnelStage } from '../../domain/types/pickup.types';

@Injectable()
export class GetPickupFunnelUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(filters?: { city?: string; timeRange?: string }): Promise<FunnelStage[]> {
    return this.pickupRepository.getFunnelData(filters);
  }
}
