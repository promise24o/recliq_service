import { Injectable } from '@nestjs/common';
import { ActivityLoggingService } from '../../../auth/domain/services/activity-logging.service';

@Injectable()
export class GetAccountActivityUseCase {
  constructor(
    private readonly activityLoggingService: ActivityLoggingService,
  ) {}

  async execute(adminId: string, limit: number = 50, offset: number = 0) {
    const activities = await this.activityLoggingService.getUserActivities(
      adminId,
      limit,
      offset,
    );

    // Transform activities to match the expected DTO format
    return activities.map(activity => ({
      id: activity._id.toString(),
      timestamp: activity.createdAt.toISOString(),
      action: activity.action,
      description: activity.description,
      ipAddress: activity.ipAddress || 'Unknown',
      device: this.extractDeviceFromUserAgent(activity.userAgent),
      success: activity.success,
    }));
  }

  private extractDeviceFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';

    // Simple device extraction from user agent
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Mac')) {
        return 'MacBook Pro';
      } else if (userAgent.includes('Windows')) {
        return 'Windows PC';
      } else if (userAgent.includes('Linux')) {
        return 'Linux PC';
      }
      return 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      return 'Safari Browser';
    }

    return 'Unknown Device';
  }
}
