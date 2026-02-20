import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UpdateNotificationPreferencesDto } from '../../presentation/dto/update-notification-preferences.dto';

@Injectable()
export class UpdateNotificationPreferencesUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(adminId: string, preferences: UpdateNotificationPreferencesDto) {
    console.log('UpdateNotificationPreferencesUseCase called with:', { adminId, preferences });
    
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    console.log('Admin found:', admin.id);

    // Convert the flat DTO structure to nested notification preferences
    const notificationSettings: any = {};

    // Map the flat DTO keys to nested notification structure
    Object.keys(preferences).forEach(key => {
      if (preferences[key as keyof UpdateNotificationPreferencesDto] !== undefined) {
        const [category, channel] = key.split('.');
        
        if (!notificationSettings[category]) {
          notificationSettings[category] = {};
        }
        
        notificationSettings[category][channel] = preferences[key as keyof UpdateNotificationPreferencesDto];
        console.log(`Setting ${category}.${channel} = ${preferences[key as keyof UpdateNotificationPreferencesDto]}`);
      }
    });

    console.log('Final notificationSettings:', notificationSettings);

    // Update the admin's notification preferences
    admin.updateNotifications(notificationSettings);

    const updatedAdmin = await this.authRepository.update(admin);
    console.log('Admin updated successfully');

    // Return the updated notification preferences
    return {
      notifications: updatedAdmin.notifications,
      message: 'Notification preferences updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
