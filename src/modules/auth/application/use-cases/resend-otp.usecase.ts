import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { OtpService } from '../../infrastructure/security/otp.service';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { BrevoSmsService } from '../../infrastructure/sms/brevo.sms.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';

export interface ResendOtpInput {
  identifier: string;
}

@Injectable()
export class ResendOtpUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private smsService: BrevoSmsService,
    private otpService: OtpService,
  ) {}

  async execute(input: ResendOtpInput): Promise<{ message: string; identifier: string; expires_in: number }> {
    const { identifier } = input;

    // Determine if email or phone
    let email: Email | undefined;
    let phone: Phone | undefined;

    try {
      if (identifier.includes('@')) {
        email = Email.create(identifier);
      } else {
        phone = Phone.create(identifier);
      }
    } catch (error) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Check if user exists
    const existingUser = email
      ? await this.authRepository.findByEmail(email.getValue())
      : await this.authRepository.findByPhone(phone!.getValue());

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Generate new OTP (allow both verified and unverified users to get OTP for login)
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    await existingUser.setOtp(otp, expiresAt, this.otpService);

    // Update user with new OTP
    await this.authRepository.update(existingUser);

    // Send OTP
    if (email) {
      await this.emailQueueService.addEmailJob({
        to: email.getValue(),
        subject: 'Your Recliq OTP Code',
        template: 'otp',
        payload: { otp, name: existingUser.name },
        priority: EmailPriority.HIGH,
        idempotencyKey: `resend-otp-${email.getValue()}-${Date.now()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    } else {
      // Send SMS for phone registration
      await this.smsService.sendOtpSms(phone!.getValue(), otp, existingUser.name);
    }

    return {
      message: 'OTP sent to your email successfully',
      identifier: identifier,
      expires_in: 600, // 10 minutes
    };
  }
}
