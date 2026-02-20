import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateCityDto {
  @ApiProperty({ example: 'Lagos', description: 'City name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Lagos', description: 'State where the city is located', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 6.5244, description: 'Latitude coordinate', required: false })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ example: 3.3792, description: 'Longitude coordinate', required: false })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiProperty({ example: 'Africa/Lagos', description: 'Timezone for the city', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: true, description: 'Whether the city is active', required: false })
  @IsOptional()
  isActive?: boolean;
}
