import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';

@Injectable()
export class RevokeAdminUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    // Revoke admin access by removing the adminSubRole
    user.adminSubRole = undefined;
    user.isVerified = false; 
    const updatedUser = await this.authRepository.update(user);
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email?.getValue(),
      role: updatedUser.role,
      adminSubRole: updatedUser.adminSubRole,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
    };
  }
}
