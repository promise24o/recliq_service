import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLATFORM_ROLES_KEY, PlatformRoleMapping } from '../decorators/platform-roles.decorator';
import { UserRole } from '../../modules/auth/domain/constants/user.constants';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const platformRoles = this.reflector.get<PlatformRoleMapping>(
      PLATFORM_ROLES_KEY,
      context.getHandler(),
    );

    // If no platform roles are defined, allow access
    if (!platformRoles) {
      return true;
    }

    const userPlatform = request.platform?.platform;

    console.log(`Platform Guard - Platform: ${userPlatform}`);

    // Check if platform is detected
    if (!userPlatform || userPlatform === 'unknown') {
      throw new ForbiddenException('Platform could not be detected. Please use a supported client.');
    }

    // Get allowed roles for this platform
    const allowedRoles = platformRoles[userPlatform];
    
    if (!allowedRoles || allowedRoles.length === 0) {
      const platformName = userPlatform === 'web' ? 'web portal' : 'mobile app';
      throw new ForbiddenException(`Access from ${platformName} is not allowed for this endpoint.`);
    }

    // For auth endpoints, let the use case handle platform-role validation after user lookup
    const isAuthEndpoint = request.route?.path?.includes('/auth/login') || 
                          request.route?.path?.includes('/auth/register') ||
                          request.route?.path?.includes('/auth/verify-otp');

    if (isAuthEndpoint) {
      console.log(`Platform Guard - Allowing auth attempt for ${userPlatform} platform`);
      return true; // Let the auth use case handle role validation
    }

    // For protected endpoints, check if user role is allowed for this platform
    const userRole = request.user?.role;
    if (!userRole) {
      throw new ForbiddenException('Authentication required for this endpoint.');
    }

    if (!allowedRoles.includes(userRole as UserRole)) {
      throw new ForbiddenException(
        `Role ${userRole} is not allowed to access this endpoint from ${userPlatform} platform. ` +
        `Allowed roles: ${allowedRoles.join(', ')}`
      );
    }

    return true;
  }
}
