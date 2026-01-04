import { SetMetadata } from '@nestjs/common';
import { ADMIN_ROLE_KEY, AdminRoleOptions } from '../guards/admin-role.guard';

/**
 * Decorator to specify admin role requirements for endpoints
 * 
 * Usage:
 * @AdminRole({ permissions: ['canAccessUsers', 'canAccessAgents'] })
 * @AdminRole({ permissions: ['canAccessFinance'], requireAll: true })
 */
export const AdminRole = (options: AdminRoleOptions) =>
  SetMetadata(ADMIN_ROLE_KEY, options);
