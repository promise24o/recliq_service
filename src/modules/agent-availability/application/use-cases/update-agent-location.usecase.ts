import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';

@Injectable()
export class UpdateAgentLocationUseCase {
  constructor(
    @Inject('IAgentAvailabilityRepository')
    private readonly agentAvailabilityRepository: IAgentAvailabilityRepository,
  ) {}

  async execute(userId: string, lat: number, lng: number): Promise<void> {
    const availability = await this.agentAvailabilityRepository.findByUserId(userId);
    
    if (!availability) {
      throw new NotFoundException('Agent availability record not found');
    }

    await this.agentAvailabilityRepository.updateLocation(userId, lat, lng);
  }
}
