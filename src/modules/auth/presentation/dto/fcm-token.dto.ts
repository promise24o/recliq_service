import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
  @ApiProperty({ 
    example: 'android', 
    enum: ['android', 'ios'],
    description: 'Device type (android or ios)' 
  })
  @IsEnum(['android', 'ios'])
  deviceType: 'android' | 'ios';

  @ApiProperty({ 
    example: 'fcm_token_here_long_string',
    description: 'FCM registration token from Firebase' 
  })
  @IsString()
  fcmToken: string;
}

export class UnregisterFcmTokenDto {
  @ApiProperty({ 
    example: 'android', 
    enum: ['android', 'ios'],
    description: 'Device type to remove token for' 
  })
  @IsEnum(['android', 'ios'])
  deviceType: 'android' | 'ios';
}

export class SendNotificationDto {
  @ApiProperty({ example: 'Test Notification' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is a test notification' })
  @IsString()
  body: string;

  @ApiProperty({ 
    example: { type: 'test', data: 'value' },
    required: false,
    description: 'Custom data payload'
  })
  @IsOptional()
  data?: Record<string, string>;

  @ApiProperty({ 
    example: 'android',
    enum: ['android', 'ios', 'all'],
    required: false,
    description: 'Target device type (optional, defaults to all)'
  })
  @IsOptional()
  @IsEnum(['android', 'ios', 'all'])
  deviceType?: 'android' | 'ios' | 'all';
}
