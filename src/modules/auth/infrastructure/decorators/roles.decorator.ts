import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/constants/user.constants';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
