import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/security/password.service';

export interface UpdatePinInput {
  userId: string;
  oldPin: string;
  newPin: string;
}

@Injectable()
export class UpdatePinUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
    private passwordService: PasswordService,
  ) {}

  async execute(input: UpdatePinInput): Promise<{ message: string }> {
    const { userId, oldPin, newPin } = input;

    // Find user
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has PIN set
    if (!user.pin) {
      throw new BadRequestException('No PIN set. Please set up a PIN first.');
    }

    // Verify old PIN
    if (!await user.verifyPin(oldPin, this.passwordService)) {
      throw new UnauthorizedException('Current PIN is incorrect');
    }

    // Check if new PIN is same as old PIN
    if (await user.verifyPin(newPin, this.passwordService)) {
      throw new BadRequestException('New PIN must be different from current PIN');
    }

    // Update PIN
    await user.setPin(newPin, this.passwordService);

    // Update user in repository
    await this.authRepository.update(user);

    return {
      message: 'PIN updated successfully',
    };
  }
}
