import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';

export interface UpdateProfileInput {
  userId: string;
  profilePhoto?: string;
  phone?: string;
  priceUpdates?: boolean;
  loginEmails?: boolean;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
  ) {}

  async execute(input: UpdateProfileInput): Promise<{ message: string }> {
    const { userId, profilePhoto, phone, priceUpdates, loginEmails } = input;

    // Find user
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user profile (name is not allowed to be changed)
    if (profilePhoto) {
      user.updateProfilePhoto(profilePhoto);
    }

    if (phone) {
      user.updatePhone(phone);
    }

    if (priceUpdates !== undefined || loginEmails !== undefined) {
      user.updateNotifications({
        priceUpdates,
        loginEmails,
      });
    }

    // Update user in repository
    await this.authRepository.update(user);

    return {
      message: 'Profile updated successfully',
    };
  }
}
