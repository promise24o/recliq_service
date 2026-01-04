import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';

export interface BiometricInput {
  userId: string;
  enabled: boolean;
}

@Injectable()
export class BiometricUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
  ) {}

  async execute(input: BiometricInput): Promise<{ message: string; biometricEnabled: boolean }> {
    const { userId, enabled } = input;

    // Find user
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('Please verify your account before enabling biometric access');
    }

    // Update biometric setting
    if (enabled) {
      user.enableBiometric();
    } else {
      user.disableBiometric();
    }

    // Update user
    await this.authRepository.update(user);

    return {
      message: enabled ? 'Biometric access enabled successfully' : 'Biometric access disabled successfully',
      biometricEnabled: user.biometricEnabled,
    };
  }
}
