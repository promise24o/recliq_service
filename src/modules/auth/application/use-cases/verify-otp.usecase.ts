import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { AuthJwtService } from '../../infrastructure/security/auth-jwt.service';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface VerifyOtpInput {
  identifier: string;
  otp: string;
}

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private jwtService: AuthJwtService,
  ) {}

  async execute(input: VerifyOtpInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; name: string; email?: string; phone?: string; role: string };
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
    if (!user.verifyOtp(otp)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Save updated user
    await this.authRepository.update(user);

    // Generate tokens
    const payload = { sub: user.id, role: user.role };
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
      },
    };
  }
}