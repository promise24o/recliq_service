import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Current password', 
    example: 'oldpassword123' 
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password', 
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
