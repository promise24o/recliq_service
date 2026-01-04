import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/security/password.service';

export interface SetupPinInput {
  userId: string;
  pin: string;
}

@Injectable()
export class SetupPinUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private passwordService: PasswordService,
  ) {}

  async execute(input: SetupPinInput): Promise<{ message: string }> {
    const { userId, pin } = input;

    // Find user
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('Please verify your account before setting up a PIN');
    }

    // Set PIN
    await user.setPin(pin, this.passwordService);

    // Update user
    await this.authRepository.update(user);

    return {
      message: 'PIN set up successfully',
    };
  }
}
