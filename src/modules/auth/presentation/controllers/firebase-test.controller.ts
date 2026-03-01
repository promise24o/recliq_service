import { Controller, Get, Inject } from '@nestjs/common';
import { FcmService } from '../../../../shared/fcm/fcm.service';

@Controller('firebase-test')
export class FirebaseTestController {
  // Test controller for Firebase connection verification
  constructor(
    private readonly fcmService: FcmService,
  ) {}

  @Get('verify-connection')
  async verifyConnection() {
    try {
      // Test Firebase connection by getting app info
      const app = this.fcmService.getFirebaseApp();
      
      return {
        success: true,
        projectId: app.options.projectId,
        message: 'Firebase connection verified',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('send-direct-test')
  async sendDirectTest() {
    try {
      // Send a test message directly to Promise's token
      const result = await this.fcmService.sendNotification({
        fcmToken: 'cc_bZkGnT2qPK_GCHBQp_L:APA91bH7mvD9Hy0EJdumXsO5WXDFLKmcpbQ9Oz2tH7A27CLWLoD8kAf-oTM6QZlBwSWOEDtEZkkNFwxhKr2gXlixmIsyQ098VmIA87iFYzlAdPlfa3lmnnA',
        deviceType: 'android',
      }, {
        title: 'Direct Test',
        body: 'Testing direct Firebase connection',
        data: { test: 'direct' },
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.code,
      };
    }
  }
}
