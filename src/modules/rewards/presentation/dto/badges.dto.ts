import { ApiProperty } from '@nestjs/swagger';

export class BadgeItemDto {
  @ApiProperty({
    description: 'Unique identifier for the badge',
    example: 'badge_first_recycle',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the badge',
    example: 'First Recycle',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Detailed description of what the badge represents',
    example: 'Completed your first recycling pickup',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Icon or emoji representing the badge',
    example: '♻️',
    type: String,
  })
  icon: string;

  @ApiProperty({
    description: 'Human-readable criteria for earning the badge',
    example: 'Complete your first recycling pickup',
    type: String,
  })
  criteria: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when badge was earned (null for locked badges)',
    example: '2024-01-15T14:30:00.000Z',
    required: false,
    type: String,
  })
  earnedAt?: string;

  @ApiProperty({
    description: 'Whether the badge has been earned by the user',
    example: true,
    type: Boolean,
  })
  isEarned: boolean;
}

export class BadgesResponseDto {
  @ApiProperty({
    description: 'Total number of available badges',
    example: 12,
    type: Number,
  })
  totalBadges: number;

  @ApiProperty({
    description: 'Array of badges earned by the user',
    type: [BadgeItemDto],
  })
  earnedBadges: BadgeItemDto[];

  @ApiProperty({
    description: 'Array of badges not yet earned by the user',
    type: [BadgeItemDto],
  })
  lockedBadges: BadgeItemDto[];
}
