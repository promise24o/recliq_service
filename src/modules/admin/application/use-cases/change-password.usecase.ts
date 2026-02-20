import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { PasswordService } from '../../../auth/infrastructure/security/password.service';
import { ActivityLoggingService } from '../../../auth/domain/services/activity-logging.service';
import { AdminChangePasswordDto } from '../../presentation/dto/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    private readonly activityLoggingService: ActivityLoggingService,
  ) {}

  async execute(adminId: string, changePasswordDto: AdminChangePasswordDto, request?: Request) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Check if admin has a password
    if (!admin.password) {
      throw new BadRequestException('Admin account does not have a password set');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      changePasswordDto.currentPassword,
      admin.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await this.passwordService.verifyPassword(
      changePasswordDto.newPassword,
      admin.password,
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Validate password strength using existing service
    const passwordValidation = await this.passwordService.validatePasswordStrength(
      changePasswordDto.newPassword,
    );

    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.errors.join('; '));
    }

    // Hash the new password
    const hashedNewPassword = await this.passwordService.hashPassword(
      changePasswordDto.newPassword,
    );

    // Update the password
    admin.password = hashedNewPassword;
    const updatedAdmin = await this.authRepository.update(admin);

    // Log the password change activity
    await this.activityLoggingService.logPasswordChange(admin, request);

    return {
      id: updatedAdmin.id,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
