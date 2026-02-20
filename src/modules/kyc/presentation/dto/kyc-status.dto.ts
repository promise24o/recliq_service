import { ApiProperty } from '@nestjs/swagger';
import { KycUserType, KycTier, KycStatus } from '../../domain/types/kyc.types';
import type { BusinessDetails } from '../../domain/types/kyc.types';

export class KycLimitsDto {
  @ApiProperty({
    description: 'Daily withdrawal limit',
    example: 1000000,
  })
  dailyWithdrawal: number;

  @ApiProperty({
    description: 'Maximum allowed wallet balance',
    example: 5000000,
  })
  maxWalletBalance: number;
}

export class KycStatusResponse {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  userId: string;

  @ApiProperty({
    description: 'User type',
    enum: KycUserType,
    example: KycUserType.INDIVIDUAL,
  })
  userType: KycUserType;

  @ApiProperty({
    description: 'Current KYC tier',
    example: 'bloom',
  })
  currentTier: string;

  @ApiProperty({
    description: 'KYC status',
    example: 'verified',
  })
  status: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'BVN verification status',
    example: true,
  })
  bvnVerified: boolean;

  @ApiProperty({
    description: 'Documents uploaded status',
    example: true,
  })
  documentsUploaded: boolean;

  @ApiProperty({
    description: 'Selfie uploaded status',
    example: true,
  })
  selfieUploaded: boolean;

  @ApiProperty({
    description: 'Business documents uploaded status',
    example: false,
  })
  businessDocumentsUploaded: boolean;

  @ApiProperty({
    description: 'Business details (for enterprise users)',
    required: false,
  })
  businessDetails?: BusinessDetails;

  @ApiProperty({
    description: 'Current limits',
    type: KycLimitsDto,
  })
  limits: KycLimitsDto;

  @ApiProperty({
    description: 'Available tiers for this user type',
    example: ['sprout', 'bloom'],
  })
  availableTiers: string[];

  @ApiProperty({
    description: 'Requirements for next tier',
    example: ['BVN verification required'],
  })
  nextTierRequirements: string[];

  @ApiProperty({
    description: 'Rejection reason if applicable',
    example: 'Document quality is poor',
    required: false,
  })
  rejectionReason?: string;
}
