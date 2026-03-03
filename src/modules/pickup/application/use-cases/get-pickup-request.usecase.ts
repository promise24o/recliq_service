import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest } from '../../domain/types/pickup.types';

@Injectable()
export class GetPickupRequestUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
  ) {}

  async execute(id: string): Promise<PickupRequest> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }
    return pickup;
  }

  async findById(id: string): Promise<PickupRequest> {
    return this.execute(id);
  }
}
