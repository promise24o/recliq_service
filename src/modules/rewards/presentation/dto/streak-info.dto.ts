import { ApiProperty } from '@nestjs/swagger';

export class WeeklyActivityDto {
  @ApiProperty({
    description: 'Activity on Sunday',
    example: true,
    type: Boolean,
  })
  sun: boolean;

  @ApiProperty({
    description: 'Activity on Monday',
    example: true,
    type: Boolean,
  })
  mon: boolean;

  @ApiProperty({
    description: 'Activity on Tuesday',
    example: false,
    type: Boolean,
  })
  tue: boolean;

  @ApiProperty({
    description: 'Activity on Wednesday',
    example: true,
    type: Boolean,
  })
  wed: boolean;

  @ApiProperty({
    description: 'Activity on Thursday',
    example: false,
    type: Boolean,
  })
  thu: boolean;

  @ApiProperty({
    description: 'Activity on Friday',
    example: true,
    type: Boolean,
  })
  fri: boolean;

  @ApiProperty({
    description: 'Activity on Saturday',
    example: false,
    type: Boolean,
  })
  sat: boolean;
}

export class StreakInfoResponseDto {
  @ApiProperty({
    description: 'Current active streak in weeks',
    example: 5,
    type: Number,
  })
  currentStreakWeeks: number;

  @ApiProperty({
    description: 'Best streak achieved historically',
    example: 8,
    type: Number,
  })
  bestStreakWeeks: number;

  @ApiProperty({
    description: 'Weekly activity breakdown for current week',
    type: WeeklyActivityDto,
  })
  weeklyActivity: WeeklyActivityDto;

  @ApiProperty({
    description: 'Whether the current streak is still active',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of days until streak breaks (0 if already broken)',
    example: 2,
    type: Number,
  })
  daysUntilBreak: number;
}
