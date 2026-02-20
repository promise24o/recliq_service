import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { IActivityLogRepository } from '../../domain/repositories/activity-log.repository';
import { ActivityAction, RiskLevel, ActivitySource, ActivityOutcome } from '../persistence/activity-log.model';
import { getActionLabel, getDeviceInfo, getLocationFromIp } from '../../utils/activity-utils';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
}

@Injectable()
export class ActivityLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject('IActivityLogRepository')
    private readonly activityLogRepository: IActivityLogRepository
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Store repository reference for use in closures
    const activityLogRepository = this.activityLogRepository;
    
    // Get request details
    const userId = req.user?.id;
    const method = req.method;
    const path = req.path;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Try to extract user ID from JWT token as fallback
    let extractedUserId = userId;
    if (!userId && req.headers.authorization) {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          // Simple JWT decode (without verification for logging purposes)
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          extractedUserId = payload.sub;
        }
      } catch (error) {
        // Invalid token, continue without user ID
        console.log('Failed to extract user ID from JWT:', error.message);
      }
    }
    
    // Debug logging
    console.log('Activity Logger - Request details:', {
      path,
      method,
      userId: extractedUserId,
      hasUser: !!req.user,
      userRole: req.user?.role,
      hasAuthHeader: !!req.headers.authorization
    });
    
    // Skip logging for non-authenticated requests (except login completion)
    if (!extractedUserId && !path.includes('/auth/verify-otp')) {
      next();
      return;
    }

    // Determine action based on path and method
    const action = this.determineAction(method, path);
    if (!action) {
      console.log('Activity Logger - No action determined for path:', path);
      next();
      return;
    }

    console.log('Activity Logger - Action determined:', action);

    // Get device info from user agent
    const userAgent = req.headers['user-agent'] || '';
    const device = getDeviceInfo(userAgent);
    
    // Get location from IP (async)
    const location = await getLocationFromIp(ipAddress);
    
    // Determine risk level based on action
    const riskLevel = this.determineRiskLevel(action, path);
    
    // Prepare log data
    const logData = {
      userId: extractedUserId || undefined, // Use extracted user ID
      timestamp: new Date(),
      action,
      actionLabel: getActionLabel(action),
      description: this.generateDescription(action, method, path, req.body),
      entityType: this.determineEntityType(path),
      entityId: this.extractEntityId(path, req.body),
      entityName: this.extractEntityName(path, req.body),
      outcome: ActivityOutcome.PENDING, // Will be updated after response
      riskLevel,
      source: this.determineSource(req),
      ipAddress,
      device,
      location,
      beforeState: req.body?.beforeState,
      afterState: req.body?.afterState,
      reason: req.body?.reason,
      auditRef: `AUD-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    };

    // Override res.end to capture response status
    const originalEnd = res.end;
    const originalJson = res.json;
    
    res.end = function(chunk?: any, encoding?: any, callback?: any): any {
      // Update outcome based on response status
      const status = res.statusCode;
      logData.outcome = status >= 200 && status < 400 ? ActivityOutcome.SUCCESS : ActivityOutcome.FAILED;
      
      // Log the activity asynchronously (don't wait for it)
      if (activityLogRepository) {
        console.log('Activity Logger - Saving activity log:', {
          action: logData.action,
          userId: logData.userId,
          outcome: logData.outcome
        });
        
        activityLogRepository.create(logData).catch(err => {
          console.error('Failed to log activity:', err);
        });
      } else {
        console.log('Activity Logger - No repository available');
      }
      
      // Call the original end method with proper context
      return originalEnd.call(res, chunk, encoding, callback);
    };

    // Override res.json to capture response data if needed
    res.json = function(body: any): any {
      // Extract user ID from login/verify-otp response - check multiple possible structures
      if (body && action === 'login') {
        // Check for different possible response structures
        if (body.user?.id) {
          logData.userId = body.user.id;
        } else if (body.id) {
          logData.userId = body.id;
        } else if (body.data?.user?.id) {
          logData.userId = body.data.user.id;
        } else if (body.data?.id) {
          logData.userId = body.data.id;
        } else if (body.accessToken && body.user) {
          // JWT response with user object (like verify-otp)
          logData.userId = body.user.id;
        }
        
        // Log the response structure for debugging
        console.log('Login/OTP response structure:', JSON.stringify(body, null, 2));
        console.log('Extracted userId:', logData.userId);
      }
      
      // Call the original json method with proper context
      return originalJson.call(res, body);
    };

    next();
  }

  private determineAction(method: string, path: string): ActivityAction | null {
    // Login/logout actions
    if (path.includes('/auth/login') && method === 'POST') return ActivityAction.LOGIN;
    if (path.includes('/auth/logout') && method === 'POST') return ActivityAction.LOGOUT;
    
    // OTP verification is the actual login completion
    if (path.includes('/auth/verify-otp') && method === 'POST') return ActivityAction.LOGIN;
    
    // Password and security actions
    if (path.includes('/auth/change-password') && method === 'POST') return ActivityAction.PASSWORD_CHANGE;
    if (path.includes('/auth/two-factor') && method === 'POST') return ActivityAction.TWO_FACTOR_CHANGE;
    
    // Profile actions
    if (path.includes('/auth/profile') && (method === 'PATCH' || method === 'PUT')) return ActivityAction.PROFILE_UPDATE;
    
    // Approval/rejection actions
    if (path.includes('/approve') && method === 'POST') return ActivityAction.APPROVAL;
    if (path.includes('/reject') && method === 'POST') return ActivityAction.REJECTION;
    if (path.includes('/override') && method === 'POST') return ActivityAction.OVERRIDE;
    if (path.includes('/escalate') && method === 'POST') return ActivityAction.ESCALATION;
    
    // Settings
    if (path.includes('/settings') && (method === 'PATCH' || method === 'PUT')) return ActivityAction.SETTING_CHANGE;
    
    // Session management
    if (path.includes('/sessions') && method === 'DELETE') return ActivityAction.SESSION_TERMINATED;
    
    // Entity-specific actions
    if (path.includes('/users') && (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE')) return ActivityAction.USER_ACTION;
    if (path.includes('/agents') && (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE')) return ActivityAction.AGENT_ACTION;
    if (path.includes('/finance') && (method === 'POST' || method === 'PATCH' || method === 'PUT')) return ActivityAction.FINANCE_ACTION;
    if (path.includes('/zones') && (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE')) return ActivityAction.ZONE_ACTION;
    if (path.includes('/pricing') && (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE')) return ActivityAction.PRICING_ACTION;
    
    // Sensitive views
    if ((path.includes('/finance') || path.includes('/wallet')) && method === 'GET') return ActivityAction.SENSITIVE_VIEW;
    
    // Default: no logging for this path
    return null;
  }

  private determineRiskLevel(action: ActivityAction, path: string): RiskLevel {
    // High-risk actions
    if ([ActivityAction.FINANCE_ACTION, ActivityAction.OVERRIDE, ActivityAction.ESCALATION].includes(action)) return RiskLevel.HIGH;
    if (action === ActivityAction.PRICING_ACTION) return RiskLevel.HIGH;
    
    // Medium-risk actions
    if ([ActivityAction.PASSWORD_CHANGE, ActivityAction.TWO_FACTOR_CHANGE, ActivityAction.SENSITIVE_VIEW].includes(action)) return RiskLevel.MEDIUM;
    if ([ActivityAction.USER_ACTION, ActivityAction.AGENT_ACTION, ActivityAction.ZONE_ACTION].includes(action)) return RiskLevel.MEDIUM;
    
    // Low-risk actions
    return RiskLevel.LOW;
  }

  private determineSource(req: Request): ActivitySource {
    const userAgent = req.headers['user-agent'] || '';
    
    // Check for mobile devices
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      return ActivitySource.MOBILE;
    }
    
    // Check for API requests
    if (req.headers['x-api-key'] || req.path.includes('/api/')) {
      return ActivitySource.API;
    }
    
    // Default to web
    return ActivitySource.WEB;
  }

  private determineEntityType(path: string): string {
    if (path.includes('/users')) return 'User';
    if (path.includes('/agents')) return 'Agent';
    if (path.includes('/zones')) return 'Zone';
    if (path.includes('/pricing')) return 'Pricing Rule';
    if (path.includes('/finance')) return 'Finance';
    if (path.includes('/auth/login') || path.includes('/auth/logout')) return 'Session';
    if (path.includes('/auth')) return 'Security';
    if (path.includes('/settings')) return 'Settings';
    
    return 'System';
  }

  private extractEntityId(path: string, body: any): string {
    // Try to extract ID from path
    const pathParts = path.split('/');
    const idFromPath = pathParts[pathParts.length - 1];
    
    // Check if it looks like an ID (non-empty string that's not a file extension)
    if (idFromPath && !idFromPath.includes('.') && idFromPath !== 'approve' && idFromPath !== 'reject') {
      return idFromPath;
    }
    
    // Try to extract from request body
    if (body && body.id) {
      return body.id;
    }
    
    // Generate a placeholder ID
    return `ENTITY-${Date.now().toString(36)}`;
  }

  private extractEntityName(path: string, body: any): string {
    // Try to extract name from request body
    if (body) {
      if (body.name) return body.name;
      if (body.title) return body.title;
      if (body.email) return body.email;
    }
    
    // Default to path-based name
    const entityType = this.determineEntityType(path);
    return `${entityType} Operation`;
  }

  private generateDescription(action: ActivityAction, method: string, path: string, body: any): string {
    switch (action) {
      case 'login':
        return 'User logged in';
      case 'logout':
        return 'User logged out';
      case 'password_change':
        return 'Changed password';
      case 'two_factor_change':
        if (body?.enabled) {
          return 'Enabled two-factor authentication';
        } else {
          return 'Disabled two-factor authentication';
        }
      case 'profile_update':
        return 'Updated profile information';
      case 'approval':
        return `Approved ${this.determineEntityType(path).toLowerCase()}`;
      case 'rejection':
        return `Rejected ${this.determineEntityType(path).toLowerCase()}`;
      case 'override':
        return `Overrode ${this.determineEntityType(path).toLowerCase()} settings`;
      case 'escalation':
        return `Escalated ${this.determineEntityType(path).toLowerCase()} issue`;
      case 'sensitive_view':
        return `Viewed sensitive ${this.determineEntityType(path).toLowerCase()} information`;
      case 'setting_change':
        return 'Changed system settings';
      case 'session_terminated':
        return 'Terminated user session';
      case 'user_action':
        if (method === 'POST') return 'Created new user';
        if (method === 'PATCH' || method === 'PUT') return 'Updated user';
        if (method === 'DELETE') return 'Deleted user';
        return 'Performed user action';
      case 'agent_action':
        if (method === 'POST') return 'Created new agent';
        if (method === 'PATCH' || method === 'PUT') return 'Updated agent';
        if (method === 'DELETE') return 'Deleted agent';
        return 'Performed agent action';
      case 'finance_action':
        if (path.includes('payment')) return 'Processed payment';
        if (path.includes('wallet')) return 'Modified wallet';
        return 'Performed finance action';
      case 'zone_action':
        if (method === 'POST') return 'Created new zone';
        if (method === 'PATCH' || method === 'PUT') return 'Updated zone';
        if (method === 'DELETE') return 'Deleted zone';
        return 'Performed zone action';
      case 'pricing_action':
        if (method === 'POST') return 'Created new pricing rule';
        if (method === 'PATCH' || method === 'PUT') return 'Updated pricing rule';
        if (method === 'DELETE') return 'Deleted pricing rule';
        return 'Performed pricing action';
      default:
        return 'Performed system action';
    }
  }
}
