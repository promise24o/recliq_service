import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { Email } from '../../../auth/domain/value-objects/email.vo';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class UpdateAdminUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(
    id: string,
    data: {
      name?: string;
      email?: string;
      adminSubRole?: AdminSubRole;
    },
  ) {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Admin not found');
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.email) {
      user.email = Email.create(data.email);
    }

    if (data.adminSubRole) {
      user.adminSubRole = data.adminSubRole;
    }

    const updatedUser = await this.authRepository.update(user);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email?.getValue(),
      role: updatedUser.role,
      adminSubRole: updatedUser.adminSubRole,
      status: updatedUser.isVerified ? 'active' : 'suspended',
      createdAt: updatedUser.createdAt,
    };
  }
}
