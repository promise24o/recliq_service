import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  getOtpExpiry(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10 minutes
    return now;
  }
}