import { ApiProperty } from '@nestjs/swagger';

export class LevelInfoDto {
  @ApiProperty({
    description: 'Current level number',
    example: 3,
    type: Number,
  })
  number: number;

  @ApiProperty({
    description: 'Current level name',
    example: 'Eco Warrior',
    type: String,
  })
  name: string;
}

export class RewardsOverviewResponseDto {
  @ApiProperty({
    description: 'Total reward points accumulated by the user',
    example: 1250,
    type: Number,
  })
  totalPoints: number;

  @ApiProperty({
    description: 'Current level information',
    type: LevelInfoDto,
  })
  level: LevelInfoDto;

  @ApiProperty({
    description: 'Points needed to reach the next level',
    example: 250,
    type: Number,
  })
  pointsToNextLevel: number;

  @ApiProperty({
    description: 'Progress percentage to next level (0-100)',
    example: 83,
    type: Number,
  })
  levelProgressPercent: number;
}
