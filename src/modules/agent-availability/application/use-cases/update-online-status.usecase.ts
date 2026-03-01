import { Injectable, Inject } from '@nestjs/common';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';

@Injectable()
export class UpdateOnlineStatusUseCase {
  constructor(
    @Inject('IAgentAvailabilityRepository')
    private readonly availabilityRepository: IAgentAvailabilityRepository,
  ) {}

  async execute(userId: string, isOnline: boolean): Promise<{ isOnline: boolean }> {
    const availability = await this.availabilityRepository.updateOnlineStatus(userId, isOnline);
    return { isOnline: availability.isOnline };
  }
}
