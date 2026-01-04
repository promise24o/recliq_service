import { Injectable, Inject } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationCategory, NotificationType } from '../../domain/enums/notification-type.enum';

export interface GetNotificationsInput {
  userId: string;
  category?: NotificationCategory;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetNotificationsOutput {
  notifications: {
    id: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    priority: string;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    readAt?: string;
  }[];
  unreadCount: number;
  hasMore: boolean;
  total: number;
}

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(input: GetNotificationsInput): Promise<GetNotificationsOutput> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    // Get one extra to check if there are more
    const notifications = await this.notificationRepository.findByUserId(
      input.userId,
      {
        category: input.category,
        type: input.type,
        unreadOnly: input.unreadOnly,
        limit: limit + 1,
        offset,
      }
    );

    const hasMore = notifications.length > limit;
    const resultNotifications = hasMore ? notifications.slice(0, limit) : notifications;

    // Get unread count
    const unreadCount = await this.notificationRepository.getUnreadCount(input.userId);

    // Get total count (simplified - in production you'd add a count method)
    const total = await this.getTotalCount(input.userId, input.category, input.type, input.unreadOnly);

    return {
      notifications: resultNotifications.map(n => ({
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        priority: n.priority,
        read: n.read,
        actionUrl: n.actionUrl,
        actionText: n.actionText,
        imageUrl: n.imageUrl,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString(),
      })),
      unreadCount,
      hasMore,
      total,
    };
  }

  private async getTotalCount(
    userId: string,
    category?: NotificationCategory,
    type?: NotificationType,
    unreadOnly?: boolean
  ): Promise<number> {
    // For now, we'll return a simplified count
    // In a real implementation, you'd add a count method to the repository
    const allNotifications = await this.notificationRepository.findByUserId(userId, {
      category,
      type,
      unreadOnly,
      limit: 1000, // Reasonable limit for count
    });
    return allNotifications.length;
  }
}
