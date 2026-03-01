import { Injectable, Logger, Inject } from '@nestjs/common';
import { FcmService, PushNotificationPayload } from '../fcm/fcm.service';
import type { IAuthRepository } from '../../modules/auth/domain/repositories/auth.repository';

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  clickAction?: string;
  sound?: string;
  badge?: number;
}

export interface NotificationTarget {
  userId: string;
  deviceType?: 'android' | 'ios' | 'all';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly fcmService: FcmService,
    @Inject('IAuthRepository')
    private readonly userRepository: IAuthRepository,
  ) {}

  async sendToUser(
    target: NotificationTarget,
    options: NotificationOptions,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.userRepository.findById(target.userId);
      if (!user) {
        this.logger.warn(`User ${target.userId} not found`);
        return { success: false, error: 'User not found' };
      }

      const fcmTokens = user.fcmTokens || {};
      let tokensToSend: string[] = [];

      if (target.deviceType && target.deviceType !== 'all') {
        // Send to specific device type
        const token = fcmTokens[target.deviceType];
        if (token) {
          tokensToSend = [token];
        }
      } else {
        // Send to all devices
        tokensToSend = Object.values(fcmTokens);
      }

      if (tokensToSend.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${target.userId}`);
        return { success: false, error: 'No FCM tokens found' };
      }

      const payload: PushNotificationPayload = {
        title: options.title,
        body: options.body,
        data: options.data,
        image: options.image,
        sound: options.sound,
        badge: options.badge,
        clickAction: options.clickAction,
      };

      const result = await this.fcmService.sendMulticastNotification(tokensToSend, payload);

      // Clean up invalid tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await this.removeInvalidTokens(target.userId, result.failedTokens);
      }

      this.logger.log(`Notification sent to user ${target.userId}: ${result.successCount}/${tokensToSend.length} successful`);

      return { success: result.success };
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${target.userId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    options: NotificationOptions,
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser({ userId }, options);
      if (result.success) {
        totalSuccess++;
      } else {
        totalFailure++;
      }
    }

    return {
      success: totalFailure === 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
    };
  }

  async sendPickupRequestNotification(
    userId: string,
    pickupId: string,
    agentName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Pickup Request Confirmed',
        body: agentName 
          ? `${agentName} is on the way to pick up your items!`
          : 'Your pickup request has been confirmed. We\'re finding an agent for you.',
        data: {
          type: 'pickup_request',
          pickupId,
          agentName: agentName || '',
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendAgentAssignedNotification(
    userId: string,
    pickupId: string,
    agentName: string,
    estimatedArrivalTime: number,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Agent Assigned',
        body: `${agentName} is assigned to your pickup. ETA: ${estimatedArrivalTime} minutes`,
        data: {
          type: 'agent_assigned',
          pickupId,
          agentName,
          eta: estimatedArrivalTime.toString(),
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendAgentEnRouteNotification(
    userId: string,
    pickupId: string,
    agentName: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Agent En Route',
        body: `${agentName} is on the way to your location!`,
        data: {
          type: 'agent_en_route',
          pickupId,
          agentName,
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendPickupCompletedNotification(
    userId: string,
    pickupId: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Pickup Completed',
        body: 'Great! Your pickup has been completed successfully.',
        data: {
          type: 'pickup_completed',
          pickupId,
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendAgentStatusChangeNotification(
    userId: string,
    agentName: string,
    isOnline: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Agent Status Update',
        body: isOnline 
          ? `${agentName} is now online and available for pickups`
          : `${agentName} is currently offline`,
        data: {
          type: 'agent_status_change',
          agentName,
          status: isOnline ? 'online' : 'offline',
        },
        sound: 'default',
      },
    );
  }

  async sendNewPickupRequestToAgent(
    agentId: string,
    pickupId: string,
    userName: string,
    wasteType: string,
    estimatedWeight: number,
    address: string,
    totalAmount: number,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId: agentId },
      {
        title: 'New Pickup Request',
        body: `${userName} needs a ${wasteType} pickup (${estimatedWeight}kg) at ${address}`,
        data: {
          type: 'new_pickup_request',
          pickupId,
          userName,
          wasteType,
          estimatedWeight: estimatedWeight.toString(),
          address,
          totalAmount: totalAmount.toString(),
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendPickupCancelledNotification(
    userId: string,
    pickupId: string,
    cancelledBy: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Pickup Cancelled',
        body: `Your pickup request has been cancelled. Reason: ${reason}`,
        data: {
          type: 'pickup_cancelled',
          pickupId,
          cancelledBy,
          reason,
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendPickupCancelledToAgent(
    agentId: string,
    pickupId: string,
    userName: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId: agentId },
      {
        title: 'Pickup Cancelled by User',
        body: `${userName} has cancelled their pickup request. Reason: ${reason}`,
        data: {
          type: 'pickup_cancelled',
          pickupId,
          userName,
          reason,
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  async sendAgentArrivedNotification(
    userId: string,
    pickupId: string,
    agentName: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendToUser(
      { userId },
      {
        title: 'Agent Has Arrived',
        body: `${agentName} has arrived at your location!`,
        data: {
          type: 'agent_arrived',
          pickupId,
          agentName,
        },
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
    );
  }

  private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.fcmTokens) return;

      const updatedTokens = { ...user.fcmTokens };
      let removedCount = 0;

      // Find and remove invalid tokens
      for (const [deviceType, token] of Object.entries(updatedTokens)) {
        if (invalidTokens.includes(token)) {
          delete updatedTokens[deviceType];
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await this.userRepository.updatePartial(userId, { fcmTokens: updatedTokens } as any);
        this.logger.log(`Removed ${removedCount} invalid FCM tokens for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove invalid tokens for user ${userId}:`, error.message);
    }
  }
}
