import { Injectable, Inject } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequestSummary } from '../../domain/types/pickup.types';

@Injectable()
export class GetPickupSummaryUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(filters?: { city?: string; timeRange?: string }): Promise<PickupRequestSummary> {
    return this.pickupRepository.getSummary(filters);
  }
}
