import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email?: Email,
    public phone?: Phone,
    public role: UserRole = UserRole.USER,
    public adminSubRole?: AdminSubRole,
    public isVerified: boolean = false,
    public password?: string,
    public pin?: string,
    public biometricEnabled: boolean = false,
    public profilePhoto?: string,
    public referralCode?: string,
    public notifications: {
      priceUpdates: boolean;
      loginEmails: boolean;
    } = {
      priceUpdates: false,
      loginEmails: false,
    },
    public otp?: string,
    public otpExpiresAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  async setOtp(otp: string, expiresAt: Date, otpService?: any) {
    if (otpService) {
      this.otp = await otpService.hashOtp(otp);
    } else {
      this.otp = otp; // Fallback for backward compatibility
    }
    this.otpExpiresAt = expiresAt;
    this.updatedAt = new Date();
  }

  async setPassword(password: string, passwordService?: any) {
    if (passwordService) {
      this.password = await passwordService.hashPassword(password);
    } else {
      throw new Error('Password service is required for secure password hashing');
    }
    this.updatedAt = new Date();
  }

  async verifyPassword(password: string, passwordService?: any): Promise<boolean> {
    if (!this.password || !passwordService) {
      return false;
    }
    return await passwordService.verifyPassword(password, this.password);
  }

  async verifyOtp(otp: string, otpService?: any): Promise<boolean> {
    if (!this.otp || !this.otpExpiresAt || this.otpExpiresAt <= new Date()) {
      return false;
    }

    let isValid = false;
    if (otpService) {
      isValid = await otpService.verifyOtp(otp, this.otp);
    } else {
      // Fallback for backward compatibility
      isValid = this.otp === otp;
    }

    if (isValid) {
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

  async setPin(pin: string, passwordService?: any) {
    if (passwordService) {
      this.pin = await passwordService.hashPassword(pin);
    } else {
      throw new Error('Password service is required for secure PIN hashing');
    }
    this.updatedAt = new Date();
  }

  async verifyPin(pin: string, passwordService?: any): Promise<boolean> {
    if (!this.pin || !passwordService) {
      return false;
    }
    return await passwordService.verifyPassword(pin, this.pin);
  }

  enableBiometric() {
    this.biometricEnabled = true;
    this.updatedAt = new Date();
  }

  disableBiometric() {
    this.biometricEnabled = false;
    this.updatedAt = new Date();
  }

  updateProfilePhoto(photoUrl: string) {
    this.profilePhoto = photoUrl;
    this.updatedAt = new Date();
  }

  updatePhone(phoneNumber: string) {
    this.phone = Phone.create(phoneNumber);
    this.updatedAt = new Date();
  }

  updateNotifications(settings: { priceUpdates?: boolean; loginEmails?: boolean }) {
    if (settings.priceUpdates !== undefined) {
      this.notifications.priceUpdates = settings.priceUpdates;
    }
    if (settings.loginEmails !== undefined) {
      this.notifications.loginEmails = settings.loginEmails;
    }
    this.updatedAt = new Date();
  }
}