import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileDto {
  @ApiProperty({ example: 'ADM-001' })
  id: string;

  @ApiProperty({ example: 'Adaeze' })
  firstName: string;

  @ApiProperty({ example: 'Nwosu' })
  lastName: string;

  @ApiProperty({ example: 'adaeze.nwosu@recliq.ng' })
  email: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  phone: string;

  @ApiProperty({ example: '/images/profile/user-1.jpg', required: false })
  avatar?: string;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  role: string;

  @ApiProperty({ example: 'active', enum: ['active', 'restricted', 'suspended'] })
  accountStatus: string;

  @ApiProperty({ example: 'Platform Operations' })
  department: string;

  @ApiProperty({ example: '2023-01-15T00:00:00Z' })
  joinedAt: string;

  @ApiProperty({ example: '2024-01-15T09:32:00Z' })
  lastLogin: string;
}

export class SecuritySettingsDto {
  @ApiProperty({ example: '2024-01-02T14:00:00Z' })
  passwordLastChanged: string;

  @ApiProperty({ example: 'strong', enum: ['weak', 'moderate', 'strong'] })
  passwordStrength: string;

  @ApiProperty({ example: true })
  twoFactorEnabled: boolean;

  @ApiProperty({ example: 'authenticator', enum: ['authenticator', 'sms', 'none'] })
  twoFactorMethod: string;

  @ApiProperty({ example: true })
  backupCodesGenerated: boolean;

  @ApiProperty({ example: 6 })
  backupCodesRemaining: number;

  @ApiProperty({ example: true })
  enforceStrongPassword: boolean;
}


export class AccountActivityDto {
  @ApiProperty({ example: 'ACT-001' })
  id: string;

  @ApiProperty({ example: '2024-01-15T09:32:00Z' })
  timestamp: string;

  @ApiProperty({ example: 'login' })
  action: string;

  @ApiProperty({ example: 'Logged in from Chrome on MacBook Pro' })
  description: string;

  @ApiProperty({ example: '105.112.45.123' })
  ipAddress: string;

  @ApiProperty({ example: 'MacBook Pro 16"' })
  device: string;

  @ApiProperty({ example: true })
  success: boolean;
}

export class NotificationPreferenceDto {
  @ApiProperty({ example: 'NP-001' })
  id: string;

  @ApiProperty({ example: 'Security' })
  category: string;

  @ApiProperty({ example: 'Login Alerts' })
  label: string;

  @ApiProperty({ example: 'Notify on new login from unrecognized device' })
  description: string;

  @ApiProperty({ example: true })
  email: boolean;

  @ApiProperty({ example: true })
  inApp: boolean;

  @ApiProperty({ example: true })
  forced: boolean;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ example: 'NP-001' })
  id: string;

  @ApiProperty({ example: 'email', enum: ['email', 'inApp'] })
  channel: string;

  @ApiProperty({ example: true })
  value: boolean;
}
