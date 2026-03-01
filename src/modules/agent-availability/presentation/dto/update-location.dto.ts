import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateAgentLocationDto {
  @ApiProperty({ example: 4.7803, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 6.9819, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: 15.5, description: 'GPS accuracy in meters', required: false })
  @IsNumber()
  @IsOptional()
  accuracy?: number;
}
