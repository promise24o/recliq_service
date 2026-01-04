import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { OtpService } from '../../infrastructure/security/otp.service';
import { PasswordService } from '../../infrastructure/security/password.service';

export interface ForgotPinInput {
  email: string;
  otp: string;
  newPin: string;
}

@Injectable()
export class ForgotPinUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private otpService: OtpService,
    private passwordService: PasswordService,
  ) {}

  async execute(input: ForgotPinInput): Promise<{ message: string }> {
    const { email, otp, newPin } = input;

    // Find user by email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('User account is not verified');
    }

    // Verify OTP
    if (!user.otp || !await user.verifyOtp(otp, this.otpService)) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    user.clearOtp();

    // Update PIN
    await user.setPin(newPin, this.passwordService);

    // Update user in repository
    await this.authRepository.update(user);

    return {
      message: 'PIN reset successfully',
    };
  }
}
