import { IsString, IsNotEmpty, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../shared/constants/roles';

export class RegisterDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address or phone number', example: 'user@example.com or +2348012345678' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @ApiProperty({ description: 'User password', example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;

  @ApiProperty({ 
    description: 'Optional referral code from another user', 
    example: 'ABC123',
    required: false
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}