import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { AuthJwtService } from '../../infrastructure/security/auth-jwt.service';
import { OtpService } from '../../infrastructure/security/otp.service';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';
import { WalletSeedingService } from '../../../wallet/infrastructure/services/wallet-seeding.service';

export interface VerifyOtpInput {
  identifier: string;
  otp: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private jwtService: AuthJwtService,
    private otpService: OtpService,
    private emailQueueService: EmailQueueService,
    private walletSeedingService: WalletSeedingService,
  ) {}

  private async getClientLocation(req?: any): Promise<{ location: string; ipAddress: string }> {
    // Extract IP address from request headers
    const forwardedFor = req?.headers['x-forwarded-for'];
    const realIp = req?.headers['x-real-ip'];
    const cfConnectingIp = req?.headers['cf-connecting-ip']; // Cloudflare
    const xClientIp = req?.headers['x-client-ip'];
    
    const ip = forwardedFor?.split(',')[0]?.trim() || 
              realIp || 
              cfConnectingIp || 
              xClientIp || 
              req?.connection?.remoteAddress || 
              req?.socket?.remoteAddress || 
              '127.0.0.1';
    
    // For local development, provide a more descriptive location
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.0.0.1')) {
      return {
        location: 'Local Development Environment',
        ipAddress: '127.0.0.1'
      };
    }
    
    // For Flutter emulator/Dart development
    if (ip.includes('::ffff:127.0.0.1') || ip === '::1') {
      return {
        location: 'Flutter Emulator (Local Development)',
        ipAddress: '127.0.0.1'
      };
    }
    
    // Use ipinfo.io API for geolocation
    try {
      const response = await fetch(`https://ipinfo.io/json?token=cccbd6831f7ccd`);
      const data = await response.json();
      
      let location = 'Unknown Location';
      if (data.city && data.region && data.country) {
        location = `${data.city}, ${data.region}, ${data.country}`;
      } else if (data.city && data.country) {
        location = `${data.city}, ${data.country}`;
      } else if (data.country) {
        location = data.country;
      }
      
      return {
        location,
        ipAddress: data?.ip || ip
      };
    } catch (error) {
      // Fallback to IP-based location if API fails
      return {
        location: `IP Address: ${ip}`,
        ipAddress: ip
      };
    }
  }

  private async getClientIp(req?: any): Promise<string> {
    const locationData = await this.getClientLocation(req);
    return locationData.ipAddress;
  }

  async execute(input: VerifyOtpInput, req?: any): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; name: string; email?: string; phone?: string; role: string; pin?: string };
  }> {
    const { identifier, otp } = input;

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

    // Verify OTP
    if (!(await user.verifyOtp(otp, this.otpService))) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Save updated user
    await this.authRepository.update(user);

    // Generate account number for new verified users
    try {
      await this.walletSeedingService.generateAccountNumberForUser(user.id);
    } catch (error) {
      // Log error but don't fail the verification
      console.error(`Failed to generate account number for user ${user.id}:`, error.message);
    }

    // Send login notification email if enabled
    if (user.notifications?.loginEmails && user.email) {
      const locationData = await this.getClientLocation(req);
      const loginTime = new Date().toLocaleString();

      await this.emailQueueService.addEmailJob({
        to: user.email.getValue(),
        subject: 'New login to your Recliq account',
        template: 'login-notification',
        payload: { 
          name: user.name, 
          location: locationData.location, 
          ipAddress: locationData.ipAddress, 
          loginTime 
        },
        priority: EmailPriority.MEDIUM,
        idempotencyKey: `login-notification-${user.email.getValue()}-${Date.now()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    }

    // Generate tokens
    const payload = { sub: user.id, role: user.role, adminSubRole: user.adminSubRole };
    const accessToken = this.jwtService.generateAccessToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email?.getValue(),
        phone: user.phone?.getValue(),
        role: user.role,
        pin: user.pin,
      },
    };
  }
}