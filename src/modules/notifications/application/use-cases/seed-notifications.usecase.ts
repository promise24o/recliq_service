import { Injectable, Inject } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationType, NotificationCategory, NotificationPriority } from '../../domain/enums/notification-type.enum';

export interface SeedNotificationsOutput {
  count: number;
}

@Injectable()
export class SeedNotificationsUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId?: string): Promise<SeedNotificationsOutput> {
    // For demo purposes, create sample notifications
    const sampleNotifications = [
      {
        userId: userId || 'demo-user-id',
        type: NotificationType.WALLET_CREDIT,
        category: NotificationCategory.FINANCE,
        title: 'Wallet Credited',
        message: '₦1,500 has been added to your wallet for PET pickup.',
        priority: NotificationPriority.HIGH,
        actionUrl: '/wallet',
        actionText: 'View Wallet',
      },
      {
        userId: userId || 'demo-user-id',
        type: NotificationType.PICKUP_REQUESTED,
        category: NotificationCategory.OPERATIONS,
        title: 'Pickup Requested',
        message: 'Your pickup request has been received and is being processed.',
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/pickups',
        actionText: 'View Pickup',
      },
      {
        userId: userId || 'demo-user-id',
        type: NotificationType.MILESTONE_REACHED,
        category: NotificationCategory.REWARDS,
        title: 'Milestone Reached!',
        message: 'Congratulations! You\'ve recycled 100kg of materials.',
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/rewards',
        actionText: 'View Rewards',
      },
      {
        userId: userId || 'demo-user-id',
        type: NotificationType.WITHDRAWAL_SUCCESS,
        category: NotificationCategory.FINANCE,
        title: 'Withdrawal Successful',
        message: 'Your withdrawal of ₦2,000 has been processed successfully.',
        priority: NotificationPriority.HIGH,
        actionUrl: '/wallet/transactions',
        actionText: 'View Transaction',
      },
      {
        userId: userId || 'demo-user-id',
        type: NotificationType.NEW_FEATURE,
        category: NotificationCategory.SYSTEM,
        title: 'New Feature Available',
        message: 'Check out our new recycling tracking dashboard!',
        priority: NotificationPriority.LOW,
        actionUrl: '/dashboard',
        actionText: 'Explore',
      },
    ];

    let count = 0;
    for (const notificationData of sampleNotifications) {
      const notification = Notification.create(notificationData);
      await this.notificationRepository.create(notification);
      count++;
    }

    return { count };
  }
}
