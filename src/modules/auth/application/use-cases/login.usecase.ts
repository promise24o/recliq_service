import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { BrevoSmsService } from '../../infrastructure/sms/brevo.sms.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { PasswordService } from '../../infrastructure/security/password.service';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface LoginInput {
  identifier: string; // email or phone
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private smsService: BrevoSmsService,
    private otpService: OtpService,
    private passwordService: PasswordService,
  ) {}

  async execute(input: LoginInput): Promise<{ message: string; identifier: string; expires_in: number }> {
    const { identifier, password } = input;

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

    // Verify password
    if (!user.password || !await user.verifyPassword(password, this.passwordService)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    await user.setOtp(otp, expiresAt, this.otpService);

    // Update user
    await this.authRepository.update(user);

    // Send OTP
    if (user.email) {
      await this.emailQueueService.addEmailJob({
        to: user.email.getValue(),
        subject: 'Your Recliq OTP Code',
        template: 'otp',
        payload: { otp, name: user.name },
        priority: EmailPriority.HIGH,
        idempotencyKey: `login-otp-${user.email.getValue()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    } else {
      // Send SMS for phone login 
      await this.smsService.sendOtpSms(user.phone!.getValue(), otp, user.name);
    }

    return {
      message: 'OTP sent to your email successfully',
      identifier,
      expires_in: 600,
    };
  }
}