import { ApiProperty } from '@nestjs/swagger';

export class ActivityItemDto {
  @ApiProperty({
    description: 'Unique identifier for the activity entry',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Type of reward activity',
    enum: ['RECYCLE', 'STREAK', 'BADGE', 'CHALLENGE', 'REFERRAL', 'BONUS'],
    example: 'RECYCLE',
  })
  type: string;

  @ApiProperty({
    description: 'Human-readable description of the activity',
    example: 'Recycled 5.2kg of plastic waste',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Points awarded or deducted for this activity',
    example: 10,
    type: Number,
  })
  points: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the activity occurred',
    example: '2024-01-15T14:30:00.000Z',
    type: String,
  })
  date: string;
}

export class RewardsActivityResponseDto {
  @ApiProperty({
    description: 'Array of reward activity items',
    type: [ActivityItemDto],
  })
  activity: ActivityItemDto[];

  @ApiProperty({
    description: 'Indicates if there are more items available',
    example: true,
    type: Boolean,
  })
  hasMore: boolean;
}
