import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../constants/roles';
import { AdminSubRole, ADMIN_PERMISSIONS } from '../constants/admin-sub-roles';

export interface AdminRoleOptions {
  requireAll?: boolean;
  permissions?: Array<keyof typeof ADMIN_PERMISSIONS[AdminSubRole]>;
}

export const ADMIN_ROLE_KEY = 'adminRole';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredOptions = this.reflector.get<AdminRoleOptions>(
      ADMIN_ROLE_KEY,
      context.getHandler(),
    );

    if (!requiredOptions) {
      return true; // No admin role requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check if user is admin
    if (user.role !== UserRole.ADMIN) {
      return false;
    }

    // If no admin sub-role, deny access
    if (!user.adminSubRole) {
      return false;
    }

    const userPermissions = ADMIN_PERMISSIONS[user.adminSubRole];

    // Super Admin has access to everything
    if (userPermissions.canAccessAll) {
      return true;
    }

    // Check if specific permissions are required
    if (requiredOptions.permissions && requiredOptions.permissions.length > 0) {
      if (requiredOptions.requireAll) {
        // User must have ALL specified permissions
        return requiredOptions.permissions.every(
          permission => userPermissions[permission],
        );
      } else {
        // User must have AT LEAST ONE of the specified permissions
        return requiredOptions.permissions.some(
          permission => userPermissions[permission],
        );
      }
    }

    return true;
  }
}
