import { SetMetadata } from '@nestjs/common';
import { AdminSubRole } from '../../domain/constants/user.constants';

export const ADMIN_SUBROLES_KEY = 'adminSubroles';
export const AdminSubRoles = (...subroles: AdminSubRole[]) => SetMetadata(ADMIN_SUBROLES_KEY, subroles);
