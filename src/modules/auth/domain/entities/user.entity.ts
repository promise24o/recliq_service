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
      // Admin notification preferences
      loginAlerts?: {
        email: boolean;
        inApp: boolean;
      };
      passwordChanges?: {
        email: boolean;
        inApp: boolean;
      };
      failedLoginAttempts?: {
        email: boolean;
        inApp: boolean;
      };
      pickupEscalations?: {
        email: boolean;
        inApp: boolean;
      };
      agentStatusChanges?: {
        email: boolean;
        inApp: boolean;
      };
      paymentApprovals?: {
        email: boolean;
        inApp: boolean;
      };
      floatAlerts?: {
        email: boolean;
        inApp: boolean;
      };
      systemUpdates?: {
        email: boolean;
        inApp: boolean;
      };
    } = {
      priceUpdates: false,
      loginEmails: false,
    },
    public location?: {
      type: 'Point';
      coordinates: [number, number];
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    },
    public otp?: string,
    public otpExpiresAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  async setOtp(otp: string, expiresAt: Date, otpService?: any) {
    console.log('User Entity - Setting OTP:');
    console.log('- Plain OTP:', otp);
    console.log('- Expires At:', expiresAt);
    
    if (otpService) {
      this.otp = await otpService.hashOtp(otp);
      console.log('- Hashed OTP:', this.otp);
    } else {
      this.otp = otp; // Fallback for backward compatibility
      console.log('- Plain OTP stored (fallback)');
    }
    this.otpExpiresAt = expiresAt;
    this.updatedAt = new Date();
    console.log('- User Entity OTP set successfully');
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
    console.log('User Entity - OTP Verification:');
    console.log('- Input OTP:', otp);
    console.log('- Stored OTP exists:', !!this.otp);
    console.log('- OTP Expires At:', this.otpExpiresAt);
    console.log('- Current Time:', new Date());
    console.log('- Is expired:', this.otpExpiresAt && this.otpExpiresAt <= new Date());
    
    if (!this.otp || !this.otpExpiresAt || this.otpExpiresAt <= new Date()) {
      console.log('User Entity - OTP validation failed: missing or expired');
      return false;
    }

    let isValid = false;
    if (otpService) {
      console.log('User Entity - Using OTP service for verification');
      isValid = await otpService.verifyOtp(otp, this.otp);
      console.log('User Entity - OTP service verification result:', isValid);
    } else {
      // Fallback for backward compatibility
      console.log('User Entity - Using fallback verification');
      isValid = this.otp === otp;
      console.log('User Entity - Fallback verification result:', isValid);
    }

    if (isValid) {
      console.log('User Entity - OTP verification successful, clearing OTP');
      this.isVerified = true;
      this.otp = undefined;
      this.otpExpiresAt = undefined;
      this.updatedAt = new Date();
      return true;
    }
    
    console.log('User Entity - OTP verification failed');
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

  updateNotifications(settings: { 
    priceUpdates?: boolean; 
    loginEmails?: boolean;
    // Admin notification preferences
    loginAlerts?: { email?: boolean; inApp?: boolean };
    passwordChanges?: { email?: boolean; inApp?: boolean };
    failedLoginAttempts?: { email?: boolean; inApp?: boolean };
    pickupEscalations?: { email?: boolean; inApp?: boolean };
    agentStatusChanges?: { email?: boolean; inApp?: boolean };
    paymentApprovals?: { email?: boolean; inApp?: boolean };
    floatAlerts?: { email?: boolean; inApp?: boolean };
    systemUpdates?: { email?: boolean; inApp?: boolean };
  }) {
    // Basic notifications
    if (settings.priceUpdates !== undefined) {
      this.notifications.priceUpdates = settings.priceUpdates;
    }
    if (settings.loginEmails !== undefined) {
      this.notifications.loginEmails = settings.loginEmails;
    }

    // Admin notification preferences
    const adminPrefs = [
      'loginAlerts', 'passwordChanges', 'failedLoginAttempts',
      'pickupEscalations', 'agentStatusChanges', 'paymentApprovals',
      'floatAlerts', 'systemUpdates'
    ] as const;

    adminPrefs.forEach(pref => {
      if (settings[pref]) {
        if (!this.notifications[pref]) {
          this.notifications[pref] = { email: true, inApp: true };
        }
        if (settings[pref]!.email !== undefined) {
          this.notifications[pref]!.email = settings[pref]!.email;
        }
        if (settings[pref]!.inApp !== undefined) {
          this.notifications[pref]!.inApp = settings[pref]!.inApp;
        }
      }
    });

    this.updatedAt = new Date();
  }

  updateLocation(location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    this.location = location;
    this.updatedAt = new Date();
  }
}