import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserType } from '../../domain/types/user.types';

export class LocationDto {
  @ApiProperty({
    description: 'GeoJSON point type',
    example: 'Point',
  })
  type: 'Point';

  @ApiProperty({
    description: 'GeoJSON coordinates [longitude, latitude]',
    example: [6.9749678, 4.795202],
    type: [Number],
  })
  coordinates: [number, number];

  @ApiProperty({
    description: 'Full address',
    example: 'Eagle Island Rd, Port Harcourt, Rivers, Nigeria',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'City name',
    example: 'Port Harcourt',
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: 'State name',
    example: 'Rivers',
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Nigeria',
    required: false,
  })
  country?: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '6956cd1d842c6afdc694d3fe',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Danielss',
  })
  name: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+2349031292711',
  })
  phone: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User city',
    example: 'Port Harcourt',
  })
  city: string;

  @ApiProperty({
    description: 'User zone',
    example: 'Zone A',
  })
  zone: string;

  @ApiProperty({
    description: 'User account status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User type',
    enum: UserType,
    example: UserType.INDIVIDUAL,
  })
  type: UserType;

  @ApiProperty({
    description: 'Total number of recycles',
    example: 25,
  })
  totalRecycles: number;

  @ApiProperty({
    description: 'Date of last activity',
    example: '2026-02-17T14:48:52.515Z',
  })
  lastActivity: Date;

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-01-01T19:38:05.542Z',
  })
  created: Date;

  @ApiProperty({
    description: 'Current wallet balance',
    example: 1500.50,
  })
  walletBalance: number;

  @ApiProperty({
    description: 'Pending escrow amount',
    example: 250.00,
  })
  pendingEscrow: number;

  @ApiProperty({
    description: 'Number of disputes raised',
    example: 0,
  })
  disputesRaised: number;

  @ApiProperty({
    description: 'Number of cancellations',
    example: 2,
  })
  cancellations: number;

  @ApiProperty({
    description: 'Average response time in minutes',
    example: 15,
  })
  avgResponseTime: number;

  @ApiProperty({
    description: 'Profile photo URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePhoto?: string;

  @ApiProperty({
    description: 'Whether user is verified',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'User location information',
    type: LocationDto,
    required: false,
  })
  location?: LocationDto;
}

export class PaginationInfoDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of users per page',
    example: 25,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 4,
  })
  pages: number;
}

export class UserPaginationResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto],
  })
  users: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationInfoDto,
  })
  pagination: PaginationInfoDto;
}
