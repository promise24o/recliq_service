import { ApiProperty } from '@nestjs/swagger';

export class ReferralItemDto {
  @ApiProperty({
    description: 'Unique identifier for the referral',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the referred user (may be truncated for privacy)',
    example: 'User 1234abcd',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Current status of the referral',
    enum: ['pending', 'completed'],
    example: 'completed',
  })
  status: string;

  @ApiProperty({
    description: 'Points awarded for this referral (0 for pending)',
    example: 150,
    type: Number,
  })
  points: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp when referral was completed (null for pending)',
    example: '2024-01-15T14:30:00.000Z',
    required: false,
    type: String,
  })
  completedAt?: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when referral was created',
    example: '2024-01-10T09:15:00.000Z',
    type: String,
  })
  createdAt: string;
}

export class ReferralsResponseDto {
  @ApiProperty({
    description: 'Total number of referrals made by the user',
    example: 5,
    type: Number,
  })
  totalReferrals: number;

  @ApiProperty({
    description: 'Total points earned from completed referrals',
    example: 450,
    type: Number,
  })
  pointsEarned: number;

  @ApiProperty({
    description: 'Array of recent referral activities (max 10)',
    type: [ReferralItemDto],
  })
  recentReferrals: ReferralItemDto[];
}
