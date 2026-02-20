import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ActivityDocument } from '../../infrastructure/persistence/activity.model';
import { User } from '../entities/user.entity';
import { Request } from 'express';

export interface ActivityLogData {
  action: ActivityDocument['action'];
  description: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivityLoggingService {
  constructor(
    @InjectModel('Activity')
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async logActivity(
    user: User,
    activityData: ActivityLogData,
    request?: Request,
  ): Promise<ActivityDocument> {
    const activity = new this.activityModel({
      userId: user.id,
      userRole: user.role,
      action: activityData.action,
      description: activityData.description,
      ipAddress: activityData.ipAddress || this.extractIpAddress(request),
      userAgent: activityData.userAgent || this.extractUserAgent(request),
      success: activityData.success ?? true,
      metadata: activityData.metadata,
    });

    return await activity.save();
  }

  async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ActivityDocument[]> {
    return await this.activityModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async getUserActivitiesByAction(
    userId: string,
    action: ActivityDocument['action'],
    limit: number = 20,
  ): Promise<ActivityDocument[]> {
    return await this.activityModel
      .find({ userId, action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private extractIpAddress(request?: Request): string | undefined {
    if (!request) return undefined;
    
    return (
      request.ip ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    );
  }

  private extractUserAgent(request?: Request): string | undefined {
    if (!request) return undefined;
    
    return request.headers['user-agent'];
  }

  // Convenience methods for common activities
  async logProfileUpdate(user: User, changes: Record<string, any>, request?: Request) {
    const changedFields = Object.keys(changes).join(', ');
    return this.logActivity(user, {
      action: 'profile_update',
      description: `Updated profile: ${changedFields}`,
      metadata: { changedFields, previousValues: changes },
    }, request);
  }

  async logPasswordChange(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'password_change',
      description: 'Password was changed',
    }, request);
  }

  async logPhotoChange(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'photo_change',
      description: 'Profile photo was updated',
    }, request);
  }

  async logNotificationPreferencesChange(user: User, changedPreferences: string[], request?: Request) {
    return this.logActivity(user, {
      action: 'notification_preferences_change',
      description: `Updated notification preferences: ${changedPreferences.join(', ')}`,
      metadata: { changedPreferences },
    }, request);
  }

  async logPhoneChange(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'phone_change',
      description: 'Phone number was updated',
    }, request);
  }

  async logBiometricToggle(user: User, enabled: boolean, request?: Request) {
    return this.logActivity(user, {
      action: enabled ? 'biometric_enabled' : 'biometric_disabled',
      description: `Biometric authentication ${enabled ? 'enabled' : 'disabled'}`,
    }, request);
  }

  async logPinSet(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'pin_set',
      description: 'PIN was set for the first time',
    }, request);
  }

  async logPinChange(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'pin_change',
      description: 'PIN was changed',
    }, request);
  }

  async logAccountVerified(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'account_verified',
      description: 'Account was verified',
    }, request);
  }

  async logAccountSuspended(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'account_suspended',
      description: 'Account was suspended',
    }, request);
  }

  async logAccountActivated(user: User, request?: Request) {
    return this.logActivity(user, {
      action: 'account_activated',
      description: 'Account was activated',
    }, request);
  }
}
