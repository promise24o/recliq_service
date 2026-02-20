import { Injectable, Inject } from '@nestjs/common';
import type { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import type { ISecuritySignalRepository } from '../../domain/repositories/security-signal.repository';
import { ActivityAction } from '../../infrastructure/persistence/activity-log.model';
import { SecuritySignalType, SecuritySignalSeverity } from '../../infrastructure/persistence/security-signal.model';

@Injectable()
export class SecuritySignalDetectorService {
  constructor(
    @Inject('IActivityLogRepository')
    private readonly activityLogRepository: IActivityLogRepository,
    @Inject('ISecuritySignalRepository')
    private readonly securitySignalRepository: ISecuritySignalRepository,
  ) {}

  /**
   * Process a new activity log entry and detect any security signals
   */
  async processActivityLog(activityLog: any): Promise<void> {
    // Skip processing for non-security related activities
    if (!this.isSecurityRelevant(activityLog.action)) {
      return;
    }

    // Check for failed login attempts
    if (activityLog.action === ActivityAction.FAILED_LOGIN) {
      await this.detectFailedLoginAttempts(activityLog);
    }

    // Check for unusual login times
    if (activityLog.action === ActivityAction.LOGIN) {
      await this.detectUnusualLoginTime(activityLog);
      await this.detectNewDevice(activityLog);
      await this.detectLocationAnomaly(activityLog);
    }
  }

  /**
   * Detect multiple failed login attempts
   */
  private async detectFailedLoginAttempts(activityLog: any): Promise<void> {
    const userId = activityLog.userId;
    const ipAddress = activityLog.ipAddress;
    
    // Get recent failed login attempts from the same IP in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentFailedLogins = await this.activityLogRepository.findByFilter({
      userId,
      action: ActivityAction.FAILED_LOGIN,
      dateFrom: oneHourAgo,
    });
    
    // If there are 2 or more failed attempts (including the current one)
    if (recentFailedLogins.length >= 1) {
      // Create a security signal
      await this.securitySignalRepository.create({
        userId,
        type: SecuritySignalType.FAILED_LOGIN,
        severity: SecuritySignalSeverity.CRITICAL,
        title: `${recentFailedLogins.length + 1} Failed Login Attempts`,
        description: `Multiple failed login attempts detected from IP ${ipAddress} within the last hour. This could indicate a brute force attack.`,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          ipAddress,
          attempts: recentFailedLogins.length + 1,
          device: activityLog.device,
          location: activityLog.location,
        }
      });
    }
  }

  /**
   * Detect logins at unusual times
   */
  private async detectUnusualLoginTime(activityLog: any): Promise<void> {
    const userId = activityLog.userId;
    const loginHour = new Date(activityLog.timestamp).getHours();
    
    // Define typical business hours (8 AM to 7 PM)
    const isBusinessHours = loginHour >= 8 && loginHour <= 19;
    
    // If login is outside business hours, create a security signal
    if (!isBusinessHours) {
      await this.securitySignalRepository.create({
        userId,
        type: SecuritySignalType.UNUSUAL_TIME,
        severity: SecuritySignalSeverity.WARNING,
        title: 'Unusual Login Time',
        description: `Login detected at ${loginHour}:00 hours, which is outside typical business hours (8 AM - 7 PM).`,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          loginHour,
          ipAddress: activityLog.ipAddress,
          device: activityLog.device,
          location: activityLog.location,
        }
      });
    }
  }

  /**
   * Detect logins from new devices
   */
  private async detectNewDevice(activityLog: any): Promise<void> {
    const userId = activityLog.userId;
    const device = activityLog.device;
    
    // Get all previous login activities for this user
    const previousLogins = await this.activityLogRepository.findByFilter({
      userId,
      action: ActivityAction.LOGIN,
    });
    
    // Check if this device has been used before
    const deviceUsedBefore = previousLogins.some(login => 
      login.device === device && login._id.toString() !== activityLog._id.toString()
    );
    
    // If this is a new device, create a security signal
    if (!deviceUsedBefore && previousLogins.length > 0) {
      await this.securitySignalRepository.create({
        userId,
        type: SecuritySignalType.NEW_DEVICE,
        severity: SecuritySignalSeverity.WARNING,
        title: 'New Device Detected',
        description: `Login from a new device: ${device}. If this wasn't you, consider changing your password immediately.`,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          device,
          ipAddress: activityLog.ipAddress,
          location: activityLog.location,
        }
      });
    }
  }

  /**
   * Detect logins from unusual locations
   */
  private async detectLocationAnomaly(activityLog: any): Promise<void> {
    const userId = activityLog.userId;
    const location = activityLog.location;
    
    // Get user's common locations (from the last 30 days)
    const commonLocations = await this.activityLogRepository.getDistinctLocations(userId);
    
    // If this is the first login, don't create a signal
    if (commonLocations.length <= 1) {
      return;
    }
    
    // Check if this location has been used before
    const locationUsedBefore = commonLocations.includes(location);
    
    // If this is a new location, create a security signal
    if (!locationUsedBefore) {
      await this.securitySignalRepository.create({
        userId,
        type: SecuritySignalType.LOCATION_ANOMALY,
        severity: SecuritySignalSeverity.WARNING,
        title: 'New Login Location Detected',
        description: `Login from a new location: ${location}. Your usual locations are ${commonLocations.slice(0, 2).join(', ')}${commonLocations.length > 2 ? '...' : ''}.`,
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          location,
          ipAddress: activityLog.ipAddress,
          device: activityLog.device,
          commonLocations,
        }
      });
    }
  }

  /**
   * Check if an activity is security-relevant
   */
  private isSecurityRelevant(action: ActivityAction): boolean {
    return [
      ActivityAction.LOGIN,
      ActivityAction.FAILED_LOGIN,
      ActivityAction.PASSWORD_CHANGE,
      ActivityAction.TWO_FACTOR_CHANGE,
      ActivityAction.SESSION_TERMINATED,
    ].includes(action);
  }
}
