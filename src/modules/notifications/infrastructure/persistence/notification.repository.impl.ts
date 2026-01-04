import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from './notification.model';
import { Notification } from '../../domain/entities/notification.entity';
import { 
  INotificationRepository 
} from '../../domain/repositories/notification.repository';
import { NotificationType, NotificationCategory } from '../../domain/enums/notification-type.enum';

@Injectable()
export class NotificationRepositoryImpl implements INotificationRepository {
  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: Notification): Promise<void> {
    const doc = this.toDocument(notification);
    await new this.notificationModel(doc).save();
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.notificationModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    category?: NotificationCategory;
    type?: NotificationType;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    const query: any = { userId };
    
    if (options?.category) {
      query.category = options.category;
    }
    
    if (options?.type) {
      query.type = options.type;
    }
    
    if (options?.unreadOnly) {
      query.read = false;
    }

    const docs = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.offset || 0)
      .exec();

    return docs.map(doc => this.toEntity(doc));
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: id, userId },
      { read: true, readAt: new Date() }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({ _id: id, userId });
  }

  async deleteOldNotifications(userId: string, daysOld: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    await this.notificationModel.deleteMany({
      userId,
      createdAt: { $lt: cutoffDate },
      category: { $nin: ['finance', 'security'] } // Don't delete important notifications
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationModel.countDocuments({ userId, read: false });
  }

  async update(notification: Notification): Promise<void> {
    const doc = this.toDocument(notification);
    await this.notificationModel.updateOne(
      { _id: notification.id },
      doc
    );
  }

  private toEntity(doc: NotificationDocument): Notification {
    return new Notification(
      doc._id.toString(),
      doc.userId,
      doc.type as NotificationType,
      doc.category as NotificationCategory,
      doc.title,
      doc.message,
      doc.priority as any,
      doc.read,
      doc.actionUrl,
      doc.actionText,
      doc.imageUrl,
      doc.metadata,
      (doc as any).createdAt || new Date(),
      doc.readAt,
    );
  }

  private toDocument(notification: Notification): any {
    return {
      userId: notification.userId,
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: notification.read,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      imageUrl: notification.imageUrl,
      metadata: notification.metadata,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
