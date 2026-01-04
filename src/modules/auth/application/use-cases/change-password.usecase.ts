import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/security/password.service';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private passwordService: PasswordService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<{ message: string }> {
    const { userId, currentPassword, newPassword } = input;

    // Find user
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    if (!user.password || !await user.verifyPassword(currentPassword, this.passwordService)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    if (await user.verifyPassword(newPassword, this.passwordService)) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Update password
    await user.setPassword(newPassword, this.passwordService);

    // Update user in repository
    await this.authRepository.update(user);

    return {
      message: 'Password changed successfully',
    };
  }
}
