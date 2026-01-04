import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ 
    description: 'Profile photo URL', 
    example: 'https://backblaze-bucket-url/user-id/profile-photo.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @ApiProperty({ 
    description: 'Phone number', 
    example: '+2348012345678',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'Enable price update notifications', 
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  priceUpdates?: boolean;

  @ApiProperty({ 
    description: 'Enable login email notifications', 
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  loginEmails?: boolean;
}
