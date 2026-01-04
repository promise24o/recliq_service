import { ApiProperty } from '@nestjs/swagger';

export class EnvironmentalImpactResponseDto {
  @ApiProperty({
    description: 'Total waste recycled in kilograms',
    example: 75.5,
    type: Number,
  })
  wasteRecycledKg: number;

  @ApiProperty({
    description: 'CO2 emissions saved in kilograms',
    example: 125.8,
    type: Number,
  })
  co2SavedKg: number;

  @ApiProperty({
    description: 'Equivalent number of trees planted based on CO2 savings',
    example: 12,
    type: Number,
  })
  treesEquivalent: number;

  @ApiProperty({
    description: 'Carbon score rating (A+ to F)',
    example: 'A+',
    type: String,
  })
  carbonScore: string;

  @ApiProperty({
    description: 'Water saved in liters',
    example: 7550,
    type: Number,
  })
  waterSaved: number;

  @ApiProperty({
    description: 'Energy saved in kilowatt-hours',
    example: 264,
    type: Number,
  })
  energySaved: number;

  @ApiProperty({
    description: 'Landfill space saved in cubic meters',
    example: 0.23,
    type: Number,
  })
  landfillSpaceSaved: number;
}
