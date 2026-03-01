import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { NotificationService } from '../../../../shared/services/notification.service';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';
import { SendNotificationDto } from '../dto/fcm-token.dto';

@Controller('public-fcm')
export class PublicFcmController {
  // Public FCM controller for testing notifications without authentication
  constructor(
    private readonly notificationService: NotificationService,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  @Post('send-test-all')
  @HttpCode(HttpStatus.OK)
  async sendTestNotificationToAllUsers(
    @Body() dto: SendNotificationDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get all users with FCM tokens
      const users = await this.authRepository.findAll();
      
      let totalSent = 0;
      let totalFailed = 0;
      
      for (const user of users) {
        if (user.fcmTokens && Object.keys(user.fcmTokens).length > 0) {
          // Send notification to each device type
          for (const [deviceType, token] of Object.entries(user.fcmTokens)) {
            try {
              await this.notificationService.sendToUser({
                userId: user.id,
                deviceType: deviceType as 'android' | 'ios' | 'all',
              }, {
                title: dto.title,
                body: dto.body,
                data: {
                  ...dto.data,
                  deviceType,
                  userId: user.id,
                  timestamp: new Date().toISOString(),
                },
              });
              totalSent++;
            } catch (error) {
              console.error(`Failed to send to user ${user.id} device ${deviceType}:`, error.message);
              totalFailed++;
            }
          }
        }
      }
      
      return {
        success: true,
        message: `Test notification sent to ${totalSent} devices. Failed: ${totalFailed}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test notifications: ${error.message}`,
      };
    }
  }
}
