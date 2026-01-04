import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly saltRounds = 10;

  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  getOtpExpiry(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10 minutes
    return now;
  }

  async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, this.saltRounds);
  }

  async verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(plainOtp, hashedOtp);
  }
}