import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { NotificationService } from '../../../../shared/services/notification.service';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';

@Controller('test-promise')
export class TestPromiseController {
  // Test controller for Promise's device notifications
  constructor(
    private readonly notificationService: NotificationService,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendToPromise(
    @Body() body: { title: string; body: string; data?: Record<string, string> },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userId = '6956cd1d842c6afdc694d3fe';
      
      const result = await this.notificationService.sendToUser({
        userId: userId,
        deviceType: 'android',
      }, {
        title: body.title,
        body: body.body,
        data: {
          ...body.data,
          userId: userId,
          timestamp: new Date().toISOString(),
        },
      });

      if (result.success) {
        return {
          success: true,
          message: `Notification sent successfully to Promise's Android device`,
        };
      } else {
        return {
          success: false,
          message: `Failed to send: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }
}
