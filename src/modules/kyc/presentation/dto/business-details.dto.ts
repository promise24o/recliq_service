import { ApiProperty } from '@nestjs/swagger';
import { BusinessNature } from '../../domain/types/kyc.types';

export class BusinessLocationDto {
  @ApiProperty({
    description: 'Business location latitude',
    example: 6.5244,
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    description: 'Business location longitude',
    example: 3.3792,
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    description: 'Business location address',
    example: '123 Lagos Street, Ikeja, Lagos',
    required: false,
  })
  address?: string;
}

export class BusinessDetailsDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Tech Solutions Ltd',
  })
  businessName: string;

  @ApiProperty({
    description: 'Business address',
    example: '123 Business Avenue, Victoria Island, Lagos',
  })
  businessAddress: string;

  @ApiProperty({
    description: 'Business location details',
    type: BusinessLocationDto,
    required: false,
  })
  businessLocation?: BusinessLocationDto;

  @ApiProperty({
    description: 'Nature of business',
    enum: BusinessNature,
    example: BusinessNature.OFFICE,
  })
  natureOfBusiness: BusinessNature;

  @ApiProperty({
    description: 'Business description',
    example: 'We provide technology solutions for small and medium enterprises',
  })
  businessDescription: string;

  @ApiProperty({
    description: 'Business email',
    example: 'contact@techsolutions.com',
  })
  businessEmail: string;

  @ApiProperty({
    description: 'Business phone number',
    example: '+2348012345678',
  })
  businessPhone: string;

  @ApiProperty({
    description: 'Business registration number',
    example: 'RC123456',
    required: false,
  })
  registrationNumber?: string;

  @ApiProperty({
    description: 'Tax identification number',
    example: 'TIN123456789',
    required: false,
  })
  taxIdentificationNumber?: string;
}
