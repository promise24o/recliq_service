import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsNotEmpty, IsEnum, Min, Max } from 'class-validator';
import type { ZoneStatus, SLATier, CoverageLevel, DemandIntensity } from '../../domain/types/zone.types';
import { ZoneStatusEnum, SLATierEnum, CoverageLevelEnum, DemandIntensityEnum } from '../../domain/constants/zone.constants';

export class CreateZoneDto {
  @ApiProperty({ example: 'Lekki', description: 'Zone name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Lagos', description: 'City where the zone is located' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Lagos', description: 'State where the zone is located' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Lekki Phase 1 & 2, VGC, Ajah corridor', description: 'Zone description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Zone boundary data',
    example: {
      polygon: [{ lat: 6.4400, lng: 3.4700 }, { lat: 6.4500, lng: 3.5200 }],
      center: { lat: 6.4350, lng: 3.5150 },
      areaKm2: 42.5
    }
  })
  @IsNotEmpty()
  boundary: {
    polygon: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    areaKm2: number;
  };

  @ApiProperty({ enum: ZoneStatusEnum, example: 'active', description: 'Zone status' })
  @IsEnum(ZoneStatusEnum)
  @IsOptional()
  status?: ZoneStatus;

  @ApiProperty({ enum: CoverageLevelEnum, example: 'high', description: 'Coverage level' })
  @IsEnum(CoverageLevelEnum)
  @IsNotEmpty()
  coverageLevel: CoverageLevel;

  @ApiProperty({ example: 34, description: 'Number of active agents' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  activeAgents?: number;

  @ApiProperty({ example: 40, description: 'Total number of agents' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalAgents: number;

  @ApiProperty({ example: 'PRC-005', description: 'Pricing rule ID' })
  @IsString()
  @IsOptional()
  pricingRuleId?: string;

  @ApiProperty({ example: 'Plastic - Lagos Premium', description: 'Pricing rule name' })
  @IsString()
  @IsOptional()
  pricingRuleName?: string;

  @ApiProperty({ enum: SLATierEnum, example: 'platinum', description: 'SLA tier' })
  @IsEnum(SLATierEnum)
  @IsNotEmpty()
  slaTier: SLATier;

  @ApiProperty({ 
    description: 'Pickup availability windows',
    example: [{ day: 'Monday', startTime: '07:00', endTime: '18:00' }]
  })
  @IsArray()
  @IsOptional()
  pickupAvailability?: Array<{ day: string; startTime: string; endTime: string }>;

  @ApiProperty({ example: true, description: 'Whether dropoff is eligible' })
  @IsOptional()
  dropoffEligible?: boolean;

  @ApiProperty({ example: 85, description: 'Average pickups per day' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgPickupsPerDay?: number;

  @ApiProperty({ example: 42, description: 'Average dropoffs per day' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgDropoffsPerDay?: number;

  @ApiProperty({ enum: DemandIntensityEnum, example: 'high', description: 'Demand intensity' })
  @IsEnum(DemandIntensityEnum)
  @IsNotEmpty()
  demandIntensity: DemandIntensity;

  @ApiProperty({ example: ['Dangote Industries', 'GTBank HQ'], description: 'Enterprise clients', required: false })
  @IsArray()
  @IsOptional()
  enterpriseClients?: string[];
}
