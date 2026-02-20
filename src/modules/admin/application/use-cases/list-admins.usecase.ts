import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UserRole } from '../../../../shared/constants/roles';

@Injectable()
export class ListAdminsUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute() {
    const admins = await this.authRepository.findByRole(UserRole.ADMIN);
    
    return admins.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email?.getValue(),
      role: admin.role,
      adminSubRole: admin.adminSubRole,
      status: admin.isVerified ? 'active' : 'suspended',
      photo: admin.profilePhoto,
      createdAt: admin.createdAt,
    }));
  }
}
