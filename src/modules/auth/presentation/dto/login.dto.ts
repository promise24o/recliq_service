import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email address or phone number', example: 'user@example.com or +2348012345678' })
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}