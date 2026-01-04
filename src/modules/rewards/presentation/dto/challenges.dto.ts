import { ApiProperty } from '@nestjs/swagger';

export class ChallengeItemDto {
  @ApiProperty({
    description: 'Unique identifier for the challenge',
    example: 'weekly_10kg',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Title of the challenge',
    example: 'Recycle 10kg this week',
    type: String,
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description of the challenge requirements',
    example: 'Recycle a total of 10kg of waste within this week',
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Current progress towards the challenge goal',
    example: 7.5,
    type: Number,
  })
  progress: number;

  @ApiProperty({
    description: 'Target value required to complete the challenge',
    example: 10,
    type: Number,
  })
  target: number;

  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 75,
    type: Number,
  })
  percent: number;

  @ApiProperty({
    description: 'Points awarded upon completion',
    example: 50,
    type: Number,
  })
  pointsReward: number;

  @ApiProperty({
    description: 'Number of days remaining until challenge expires',
    example: 3,
    type: Number,
  })
  daysLeft: number;

  @ApiProperty({
    description: 'Whether the challenge has been completed',
    example: false,
    type: Boolean,
  })
  completed: boolean;

  @ApiProperty({
    description: 'ISO 8601 timestamp when challenge was completed (null for active challenges)',
    example: '2024-01-15T14:30:00.000Z',
    required: false,
    type: String,
  })
  completedAt?: string;
}

export class ChallengesResponseDto {
  @ApiProperty({
    description: 'Array of currently active challenges',
    type: [ChallengeItemDto],
  })
  activeChallenges: ChallengeItemDto[];

  @ApiProperty({
    description: 'Array of completed challenges',
    type: [ChallengeItemDto],
  })
  completedChallenges: ChallengeItemDto[];
}
