import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { UserRole } from '../../../../shared/constants/roles';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { BrevoSmsService } from '../../infrastructure/sms/brevo.sms.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { PasswordService } from '../../infrastructure/security/password.service';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { ReferralCodeUtil } from '../../../../shared/utils/referral-code.util';
import type { IReferralRewardRepository } from '../../../rewards/domain/repositories/reward.repository';
import { ReferralReward } from '../../../rewards/domain/entities/referral-reward.entity';

export interface RegisterInput {
  name: string;
  identifier: string; // email or phone
  password: string;
  role?: UserRole;
  referralCode?: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private emailQueueService: EmailQueueService,
    private smsService: BrevoSmsService,
    private otpService: OtpService,
    private passwordService: PasswordService,
    @Inject('IReferralRewardRepository') private referralRewardRepository: IReferralRewardRepository,
  ) {}

  async execute(input: RegisterInput): Promise<{ message: string; identifier: string; expires_in: number }> {
    const { name, identifier, password, role = UserRole.USER, referralCode } = input;

    // Validate password strength
    const passwordValidation = await this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Determine if email or phone
    let email: Email | undefined;
    let phone: Phone | undefined;
    let referrerUser: User | null = null;

    try {
      if (identifier.includes('@')) {
        email = Email.create(identifier);
      } else {
        phone = Phone.create(identifier);
      }
    } catch (error) {
      throw new BadRequestException('Invalid identifier format');
    }

    // Validate referral code if provided
    if (referralCode) {
      if (!ReferralCodeUtil.isValidReferralCode(referralCode)) {
        throw new BadRequestException('Invalid referral code format');
      }
      
      referrerUser = await this.authRepository.findByReferralCode(referralCode);
      if (!referrerUser) {
        throw new BadRequestException('Referral code not found');
      }
    }

    // Check if user exists
    const existingUser = email
      ? await this.authRepository.findByEmail(email.getValue())
      : await this.authRepository.findByPhone(phone!.getValue());

    if (existingUser) {
      if (existingUser.isVerified) {
        // User exists and is verified - throw error
        let roleText: string;
        switch (existingUser.role) {
          case 'ADMIN':
            roleText = 'An admin';
            break;
          case 'AGENT':
            roleText = 'An agent';
            break;
          default:
            roleText = 'A user';
            break;
        }
        throw new BadRequestException(
          `${roleText} account with this ${identifier.includes('@') ? 'email' : 'phone number'} already exists`
        );
      } else {
        // User exists but not verified - resend OTP
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
            idempotencyKey: `register-otp-${email.getValue()}-${Date.now()}`,
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

    // Create user
    let userReferralCode: string;
    let isCodeUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Generate unique referral code with retry logic
    do {
      userReferralCode = ReferralCodeUtil.generateReferralCode();
      const existingUser = await this.authRepository.findByReferralCode(userReferralCode);
      if (!existingUser) {
        isCodeUnique = true;
      }
      attempts++;
    } while (!isCodeUnique && attempts < maxAttempts);
    
    if (!isCodeUnique) {
      throw new Error('Failed to generate unique referral code after multiple attempts');
    }
    
    const user = new User(
      '', // id will be set by DB
      name,
      email,
      phone,
      role,
      undefined, // adminSubRole (only for admin users)
      false, // not verified
      undefined, // password
      undefined, // pin
      false, // biometricEnabled
      undefined, // profilePhoto
      userReferralCode, // referralCode
    );

    // Set and hash password
    await user.setPassword(password, this.passwordService);

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    await user.setOtp(otp, expiresAt, this.otpService);

    // Save user
    const savedUser = await this.authRepository.save(user);

    // Create referral reward if referral code was used
    if (referrerUser) {
      const referralReward = ReferralReward.create({
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerUserId: referrerUser.id,
        referredUserId: savedUser.id,
      });
      
      await this.referralRewardRepository.create(referralReward);
    }

    // Send OTP
    if (email) {
      await this.emailQueueService.addEmailJob({
        to: email.getValue(),
        subject: 'Your Recliq OTP Code',
        template: 'otp',
        payload: { otp, name },
        priority: EmailPriority.HIGH,
        idempotencyKey: `register-otp-${email.getValue()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    } else {
      // Send SMS for phone registration (keep synchronous for now)
      await this.smsService.sendOtpSms(phone!.getValue(), otp, name);
    }

    return {
      message: 'OTP sent to your email successfully',
      identifier: identifier,
      expires_in: 600, // 10 minutes
    };
  }
}