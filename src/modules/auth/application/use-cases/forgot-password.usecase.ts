import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { OtpService } from '../../infrastructure/security/otp.service';

export interface ForgotPasswordInput {
  email: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private otpService: OtpService,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<{ message: string; email: string; expires_in: number }> {
    const { email } = input;

    // Find user by email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate password reset OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    await user.setOtp(otp, expiresAt, this.otpService);

    // Update user with OTP
    await this.authRepository.update(user);

    // Send password reset email
    await this.emailQueueService.addEmailJob({
      to: email,
      subject: 'Password Reset OTP - Recliq',
      template: 'password-reset',
      payload: { otp, name: user.name },
      priority: EmailPriority.HIGH,
      idempotencyKey: `password-reset-${email}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date(),
    });

    return {
      message: 'Password reset OTP sent to your email',
      email: email,
      expires_in: 600, // 10 minutes
    };
  }
}
