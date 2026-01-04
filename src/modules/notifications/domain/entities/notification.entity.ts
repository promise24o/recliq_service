import { 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority 
} from '../enums/notification-type.enum';
import { v4 as uuidv4 } from 'uuid';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly category: NotificationCategory,
    public readonly title: string,
    public readonly message: string,
    public readonly priority: NotificationPriority,
    public read: boolean = false,
    public readonly actionUrl?: string,
    public readonly actionText?: string,
    public readonly imageUrl?: string,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public readAt?: Date,
  ) {}

  markAsRead(): void {
    this.read = true;
    this.readAt = new Date();
  }

  markAsUnread(): void {
    this.read = false;
    this.readAt = undefined;
  }

  static create(data: {
    userId: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    priority: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    metadata?: Record<string, any>;
  }): Notification {
    return new Notification(
      uuidv4(),
      data.userId,
      data.type,
      data.category,
      data.title,
      data.message,
      data.priority,
      false,
      data.actionUrl,
      data.actionText,
      data.imageUrl,
      data.metadata,
      new Date(),
      undefined,
    );
  }

  isHighPriority(): boolean {
    return this.priority === NotificationPriority.HIGH;
  }

  isPersistent(): boolean {
    // Finance, Operations, Trust & Safety, and Security notifications are persistent
    return [
      NotificationCategory.FINANCE,
      NotificationCategory.OPERATIONS,
      NotificationCategory.TRUST_SAFETY,
      NotificationCategory.SECURITY,
    ].includes(this.category);
  }

  shouldSendPush(): boolean {
    // High priority notifications and specific categories get push
    return this.isHighPriority() || 
           [NotificationCategory.FINANCE, NotificationCategory.OPERATIONS, NotificationCategory.SECURITY].includes(this.category);
  }

  shouldSendEmail(): boolean {
    // Finance and Security notifications get email
    return [NotificationCategory.FINANCE, NotificationCategory.SECURITY].includes(this.category);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      category: this.category,
      title: this.title,
      message: this.message,
      priority: this.priority,
      read: this.read,
      actionUrl: this.actionUrl,
      actionText: this.actionText,
      imageUrl: this.imageUrl,
      metadata: this.metadata,
      createdAt: this.createdAt,
      readAt: this.readAt,
    };
  }
}
