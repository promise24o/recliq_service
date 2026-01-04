import { IsString, IsNotEmpty, IsEmail, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    description: 'Email address for password reset', 
    example: 'user@example.com' 
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
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
    description: 'New password', 
    example: 'newPassword123',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}
