import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
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

  // Location fields
  @ApiProperty({ 
    description: 'Location coordinates [longitude, latitude]', 
    example: [3.3792, 6.5244],
    required: false
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  coordinates?: [number, number];

  @ApiProperty({ 
    description: 'Full address', 
    example: '123 Main Street, Ikoyi, Lagos',
    required: false
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ 
    description: 'City', 
    example: 'Lagos',
    required: false
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ 
    description: 'State', 
    example: 'Lagos',
    required: false
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ 
    description: 'Country', 
    example: 'Nigeria',
    required: false
  })
  @IsString()
  @IsOptional()
  country?: string;
}
