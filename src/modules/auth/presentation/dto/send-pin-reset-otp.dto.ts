import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPinResetOtpDto {
  @ApiProperty({ 
    description: 'Email address for PIN reset OTP', 
    example: 'user@example.com' 
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
