import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { RegisterFcmTokenDto, UnregisterFcmTokenDto } from '../../presentation/dto/fcm-token.dto';

@Injectable()
export class ManageFcmTokenUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async registerToken(userId: string, dto: RegisterFcmTokenDto): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Get existing tokens or create new object
      const existingTokens = user.fcmTokens || {};
      
      // Update or add the new token for the device type
      const updatedTokens = {
        ...existingTokens,
        [dto.deviceType]: dto.fcmToken,
      };

      await this.authRepository.updatePartial(userId, { fcmTokens: updatedTokens } as any);

      return { 
        success: true, 
        message: `FCM token registered for ${dto.deviceType} device` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to register FCM token: ${error.message}` 
      };
    }
  }

  async unregisterToken(userId: string, dto: UnregisterFcmTokenDto): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const existingTokens = user.fcmTokens || {};
      
      if (!existingTokens[dto.deviceType]) {
        return { 
          success: false, 
          message: `No FCM token found for ${dto.deviceType} device` 
        };
      }

      // Remove the token for the specified device type
      const updatedTokens = { ...existingTokens };
      delete updatedTokens[dto.deviceType];

      await this.authRepository.updatePartial(userId, { fcmTokens: updatedTokens } as any);

      return { 
        success: true, 
        message: `FCM token unregistered for ${dto.deviceType} device` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to unregister FCM token: ${error.message}` 
      };
    }
  }

  async getUserTokens(userId: string): Promise<{ [deviceType: string]: string } | null> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user) {
        return null;
      }

      return user.fcmTokens || {};
    } catch (error) {
      return null;
    }
  }
}
