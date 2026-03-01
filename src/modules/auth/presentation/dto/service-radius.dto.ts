import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional, IsArray, Min, Max, IsString } from 'class-validator';

export class UpdateServiceRadiusDto {
  @ApiProperty({
    description: 'Service radius in kilometers',
    example: 5,
    minimum: 1,
    maximum: 30,
  })
  @IsNumber()
  @Min(1)
  @Max(30)
  radius: number;

  @ApiProperty({
    description: 'Auto-expand radius when demand is low',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoExpandRadius?: boolean;

  @ApiProperty({
    description: 'Restrict radius during peak hours',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  restrictDuringPeakHours?: boolean;

  @ApiProperty({
    description: 'Custom service zones (zone IDs)',
    example: ['zone_id_1', 'zone_id_2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceZones?: string[];
}

export class ServiceRadiusResponseDto {
  @ApiProperty({ example: 5 })
  radius: number;

  @ApiProperty({ example: false })
  autoExpandRadius: boolean;

  @ApiProperty({ example: false })
  restrictDuringPeakHours: boolean;

  @ApiProperty({ 
    example: ['zone_id_1', 'zone_id_2'],
    required: false 
  })
  serviceZones?: string[];

  @ApiProperty({
    description: 'Estimated daily requests based on radius',
    example: 15,
  })
  estimatedDailyRequests: number;

  @ApiProperty({
    description: 'Average payout per job',
    example: 2500,
  })
  averagePayoutPerJob: number;

  @ApiProperty({
    description: 'Estimated fuel cost per day',
    example: 1500,
  })
  estimatedFuelCost: number;

  @ApiProperty({
    description: 'Average response time in minutes',
    example: 8,
  })
  averageResponseTime: number;

  @ApiProperty({
    description: 'Current location coordinates',
    example: { latitude: 6.5244, longitude: 3.3792 },
    required: false,
  })
  currentLocation?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  updatedAt: string;
}
