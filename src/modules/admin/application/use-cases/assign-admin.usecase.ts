import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class AssignAdminUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(adminId: string, roleId: string) {
    const user = await this.authRepository.findById(adminId);
    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    // Validate that the roleId is a valid AdminSubRole
    if (!Object.values(AdminSubRole).includes(roleId as AdminSubRole)) {
      throw new NotFoundException('Invalid admin role');
    }

    // Assign the admin role and reactivate the account
    user.adminSubRole = roleId as AdminSubRole;
    user.isVerified = true; // Reactivate the account
    const updatedUser = await this.authRepository.update(user);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email?.getValue(),
      role: updatedUser.role,
      adminSubRole: updatedUser.adminSubRole,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
