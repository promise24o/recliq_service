import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';

@Injectable()
export class GetSecuritySettingsUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(adminId: string) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Mock security settings - in production, these would come from a security settings table
    return {
      passwordLastChanged: admin.updatedAt.toISOString(),
      passwordStrength: 'strong',
      twoFactorEnabled: false,
      twoFactorMethod: 'none',
      backupCodesGenerated: false,
      backupCodesRemaining: 0,
      enforceStrongPassword: true,
    };
  }
}
