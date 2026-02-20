import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';

@Injectable()
export class GetAdminProfileUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(adminId: string) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    return {
      id: admin.id,
      firstName: admin.name.split(' ')[0] || admin.name,
      lastName: admin.name.split(' ').slice(1).join(' ') || '',
      email: admin.email?.getValue() || '',
      phone: admin.phone?.getValue() || '',
      avatar: admin.profilePhoto,
      role: admin.adminSubRole || 'NO_ROLE',
      accountStatus: admin.isVerified ? 'active' : 'suspended',
      department: 'Platform Operations',
      joinedAt: admin.createdAt.toISOString(),
      lastLogin: admin.updatedAt.toISOString(),
    };
  }
}
