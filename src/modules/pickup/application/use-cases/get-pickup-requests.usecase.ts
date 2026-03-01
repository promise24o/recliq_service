import { Injectable, Inject } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, PickupFilters, PaginatedResult } from '../../domain/types/pickup.types';

@Injectable()
export class GetPickupRequestsUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(filters: PickupFilters): Promise<PaginatedResult<PickupRequest>> {
    return this.pickupRepository.findAll(filters);
  }

  async findByUserId(userId: string): Promise<PickupRequest[]> {
    return this.pickupRepository.findByUserId(userId);
  }

  async findByAgentId(agentId: string): Promise<PickupRequest[]> {
    return this.pickupRepository.findByAgentId(agentId);
  }
}
