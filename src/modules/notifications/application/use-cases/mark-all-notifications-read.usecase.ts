import { Injectable, Inject } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class MarkAllAsReadUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
