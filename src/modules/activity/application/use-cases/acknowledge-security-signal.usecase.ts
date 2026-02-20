import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISecuritySignalRepository } from '../../domain/repositories/security-signal.repository';

@Injectable()
export class AcknowledgeSecuritySignalUseCase {
  constructor(
    @Inject('ISecuritySignalRepository')
    private readonly securitySignalRepository: ISecuritySignalRepository,
  ) {}

  async execute(signalId: string) {
    const signal = await this.securitySignalRepository.acknowledgeSignal(signalId);
    
    if (!signal) {
      throw new NotFoundException(`Security signal with ID ${signalId} not found`);
    }
    
    return {
      id: signal._id.toString(),
      acknowledged: signal.acknowledged,
      acknowledgedAt: signal.acknowledgedAt?.toISOString()
    };
  }
}
