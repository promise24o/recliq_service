import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/auth/domain/constants/user.constants';

export const PLATFORM_ROLES_KEY = 'platform_roles';

export interface PlatformRoleMapping {
  web?: UserRole[];
  mobile?: UserRole[];
}

export const PlatformRoles = (mapping: PlatformRoleMapping) => 
  SetMetadata(PLATFORM_ROLES_KEY, mapping);

// Predefined role mappings
export const AdminOnlyPlatform = PlatformRoles({
  web: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
});

export const UserAgentPlatform = PlatformRoles({
  mobile: [UserRole.USER, UserRole.AGENT],
});

export const AllPlatforms = PlatformRoles({
  web: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  mobile: [UserRole.USER, UserRole.AGENT],
});
