import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';

export interface SendPinResetOtpInput {
  email: string;
}

@Injectable()
export class SendPinResetOtpUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private otpService: OtpService,
  ) {}

  async execute(input: SendPinResetOtpInput): Promise<{ message: string; email: string; expires_in: number }> {
    const { email } = input;

    // Find user by email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('Please verify your account before resetting your PIN');
    }

    // Generate PIN reset OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    await user.setOtp(otp, expiresAt, this.otpService);

    // Update user with OTP
    await this.authRepository.update(user);

    // Send PIN reset email
    await this.emailQueueService.addEmailJob({
      to: email,
      subject: 'PIN Reset OTP - Recliq',
      template: 'pin-reset',
      payload: { otp, name: user.name },
      priority: EmailPriority.HIGH,
      idempotencyKey: `pin-reset-${email}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date(),
    });

    return {
      message: 'PIN reset OTP sent to your email',
      email: email,
      expires_in: 600, // 10 minutes
    };
  }
}
