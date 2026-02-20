import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ADMIN_SUBROLES_KEY } from '../decorators/admin-subroles.decorator';
import { UserRole, AdminSubRole } from '../../domain/constants/user.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requiredSubRoles = this.reflector.getAllAndOverride<AdminSubRole[]>(ADMIN_SUBROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles && !requiredSubRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    
    // Check role permissions
    let hasRolePermission = false;
    if (requiredRoles) {
      hasRolePermission = requiredRoles.some((role) => {
        // Direct role match
        if (user.role === role) return true;
        
        // SUPER_ADMIN role has access to everything
        if (user.role === 'ADMIN' && user.adminSubRole === 'SUPER_ADMIN') return true;
        
        // ADMIN role with SUPER_ADMIN subrole has access to ADMIN endpoints
        if (role === UserRole.ADMIN && user.role === UserRole.ADMIN && user.adminSubRole === AdminSubRole.SUPER_ADMIN) {
          return true;
        }
        
        return false;
      });
    }
    
    // Check subrole permissions
    let hasSubRolePermission = false;
    if (requiredSubRoles && user.role === UserRole.ADMIN) {
      hasSubRolePermission = requiredSubRoles.some((subrole) => {
        return user.adminSubRole === subrole;
      });
    }
    
    // Grant access if either role or subrole permissions are satisfied
    const hasPermission = hasRolePermission || hasSubRolePermission;
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}
