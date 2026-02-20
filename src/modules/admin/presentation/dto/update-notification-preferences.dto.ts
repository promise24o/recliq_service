import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ example: true, description: 'Login Alerts - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'loginAlerts.email'?: boolean;

  @ApiProperty({ example: true, description: 'Login Alerts - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'loginAlerts.inApp'?: boolean;

  @ApiProperty({ example: true, description: 'Password Changes - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'passwordChanges.email'?: boolean;

  @ApiProperty({ example: true, description: 'Password Changes - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'passwordChanges.inApp'?: boolean;

  @ApiProperty({ example: true, description: 'Failed Login Attempts - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'failedLoginAttempts.email'?: boolean;

  @ApiProperty({ example: true, description: 'Failed Login Attempts - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'failedLoginAttempts.inApp'?: boolean;

  @ApiProperty({ example: true, description: 'Pickup Escalations - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'pickupEscalations.email'?: boolean;

  @ApiProperty({ example: true, description: 'Pickup Escalations - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'pickupEscalations.inApp'?: boolean;

  @ApiProperty({ example: false, description: 'Agent Status Changes - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'agentStatusChanges.email'?: boolean;

  @ApiProperty({ example: true, description: 'Agent Status Changes - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'agentStatusChanges.inApp'?: boolean;

  @ApiProperty({ example: true, description: 'Payment Approvals - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'paymentApprovals.email'?: boolean;

  @ApiProperty({ example: true, description: 'Payment Approvals - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'paymentApprovals.inApp'?: boolean;

  @ApiProperty({ example: true, description: 'Float Alerts - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'floatAlerts.email'?: boolean;

  @ApiProperty({ example: true, description: 'Float Alerts - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'floatAlerts.inApp'?: boolean;

  @ApiProperty({ example: false, description: 'System Updates - Email notifications' })
  @IsBoolean()
  @IsOptional()
  'systemUpdates.email'?: boolean;

  @ApiProperty({ example: true, description: 'System Updates - In-app notifications' })
  @IsBoolean()
  @IsOptional()
  'systemUpdates.inApp'?: boolean;
}
