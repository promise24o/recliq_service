import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { BrevoEmailService } from '../../infrastructure/email/brevo.email.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface LoginInput {
  identifier: string; // email or phone
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private brevoEmailService: BrevoEmailService,
    private otpService: OtpService,
  ) {}

  async execute(input: LoginInput): Promise<{ message: string; identifier: string; expires_in: number }> {
    const { identifier } = input;

    // Find user
    let user;
    if (identifier.includes('@')) {
      user = await this.authRepository.findByEmail(identifier);
    } else {
      user = await this.authRepository.findByPhone(identifier);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    user.setOtp(otp, expiresAt);

    // Update user
    await this.authRepository.update(user);

    // Send OTP
    if (user.email) {
      await this.brevoEmailService.sendOtpEmail(user.email.getValue(), otp, user.name);
    } else {
      // SMS placeholder
      console.log(`OTP for ${user.phone!.getValue()}: ${otp}`);
    }

    return {
      message: 'OTP sent',
      identifier,
      expires_in: 600,
    };
  }
}