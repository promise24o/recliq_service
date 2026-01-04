import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ 
    description: 'Email address or phone number', 
    example: 'user@example.com or +2348012345678' 
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
