import { Injectable, Inject } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification.entity';

export interface MarkAsReadInput {
  userId: string;
  notificationId: string;
}

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: MarkAsReadInput): Promise<void> {
    // Verify notification belongs to user
    const notification = await this.notificationRepository.findById(input.notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== input.userId) {
      throw new Error('Unauthorized access to notification');
    }

    await this.notificationRepository.markAsRead(input.notificationId, input.userId);
  }
}
