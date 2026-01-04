import { Notification } from '../entities/notification.entity';
import { NotificationType, NotificationCategory } from '../enums/notification-type.enum';

export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    category?: NotificationCategory;
    type?: NotificationType;
    unreadOnly?: boolean;
  }): Promise<Notification[]>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  deleteOldNotifications(userId: string, daysOld: number): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  update(notification: Notification): Promise<void>;
}
