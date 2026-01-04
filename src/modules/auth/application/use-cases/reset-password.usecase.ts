import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/security/password.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { AuthJwtService } from '../../infrastructure/security/auth-jwt.service';

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    biometricEnabled: boolean;
    profilePhoto?: string;
    notifications: {
      priceUpdates: boolean;
      loginEmails: boolean;
    };
    hasPin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private jwtService: AuthJwtService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const { email, otp, newPassword } = input;

    // Find user by email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('Please verify your account before resetting your password');
    }

    // Verify OTP
    if (!user.otp || !await user.verifyOtp(otp, this.otpService)) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    user.clearOtp();

    // Set new password
    await user.setPassword(newPassword, this.passwordService);

    // Update user in repository
    await this.authRepository.update(user);

    // Generate tokens for automatic login
    const payload = {
      sub: user.id,
      email: user.email?.getValue(),
      role: user.role,
      adminSubRole: user.adminSubRole,
    };

    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // Return user object with tokens
    return {
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email?.getValue() || '',
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        biometricEnabled: user.biometricEnabled,
        profilePhoto: user.profilePhoto,
        notifications: user.notifications,
        hasPin: !!user.pin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }
}
