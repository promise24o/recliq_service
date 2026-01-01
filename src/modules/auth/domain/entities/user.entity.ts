import { UserRole } from '../../../../shared/constants/roles';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email?: Email,
    public phone?: Phone,
    public role: UserRole = UserRole.USER,
    public isVerified: boolean = false,
    public otp?: string,
    public otpExpiresAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  setOtp(otp: string, expiresAt: Date) {
    this.otp = otp;
    this.otpExpiresAt = expiresAt;
    this.updatedAt = new Date();
  }

  verifyOtp(otp: string): boolean {
    if (this.otp === otp && this.otpExpiresAt && this.otpExpiresAt > new Date()) {
      this.isVerified = true;
      this.otp = undefined;
      this.otpExpiresAt = undefined;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  clearOtp() {
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    this.updatedAt = new Date();
  }
}