import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { UserRole } from '../../../../shared/constants/roles';
import { BrevoEmailService } from '../../infrastructure/email/brevo.email.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';

export interface RegisterInput {
  name: string;
  identifier: string; // email or phone
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private brevoEmailService: BrevoEmailService,
    private otpService: OtpService,
  ) {}

  async execute(input: RegisterInput): Promise<{ message: string; identifier: string; expires_in: number }> {
    const { name, identifier } = input;

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

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Create user
    const user = new User(
      '', // id will be set by DB
      name,
      email,
      phone,
      UserRole.USER,
      false, // not verified
    );

    // Generate OTP
    const otp = this.otpService.generateOtp();
    const expiresAt = this.otpService.getOtpExpiry();
    user.setOtp(otp, expiresAt);

    // Save user
    await this.authRepository.save(user);

    // Send OTP
    if (email) {
      await this.brevoEmailService.sendOtpEmail(email.getValue(), otp, name);
    } else {
      // For phone, placeholder - in real app, integrate SMS service
      console.log(`OTP for ${phone!.getValue()}: ${otp}`);
    }

    return {
      message: 'OTP sent',
      identifier: identifier,
      expires_in: 600, // 10 minutes
    };
  }
}