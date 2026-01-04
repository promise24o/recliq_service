import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPinDto {
  @ApiProperty({ 
    description: 'Email address for PIN reset', 
    example: 'user@example.com' 
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'OTP sent to email', 
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp: string;

  @ApiProperty({ 
    description: 'New PIN', 
    example: '5678',
    minLength: 4,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}
