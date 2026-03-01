import { Controller, Get } from '@nestjs/common';
import { testDirectSend } from '../../../../shared/fcm/firebase-connection-test';

@Controller('direct-firebase')
export class DirectFirebaseController {
  @Get('test')
  async testDirectFirebase() {
    try {
      const result = await testDirectSend();
      return {
        success: typeof result === 'string' || !result.error,
        result: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
