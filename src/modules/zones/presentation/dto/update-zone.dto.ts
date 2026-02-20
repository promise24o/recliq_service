import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ZoneStatusEnum, SLATierEnum, CoverageLevelEnum, DemandIntensityEnum } from '../../domain/constants/zone.constants';

export class UpdateZoneDto {
  @ApiProperty({ example: 'Lekki Updated', description: 'Zone name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', description: 'Zone description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Zone boundary data',
    example: {
      polygon: [{ lat: 6.4400, lng: 3.4700 }, { lat: 6.4500, lng: 3.5200 }],
      center: { lat: 6.4350, lng: 3.5150 },
      areaKm2: 42.5
    },
    required: false
  })
  @IsOptional()
  boundary?: {
    polygon: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    areaKm2: number;
  };

  @ApiProperty({ enum: ZoneStatusEnum, example: 'active', description: 'Zone status', required: false })
  @IsEnum(ZoneStatusEnum)
  @IsOptional()
  status?: string;

  @ApiProperty({ enum: CoverageLevelEnum, example: 'high', description: 'Coverage level', required: false })
  @IsEnum(CoverageLevelEnum)
  @IsOptional()
  coverageLevel?: string;

  @ApiProperty({ example: 34, description: 'Number of active agents', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  activeAgents?: number;

  @ApiProperty({ example: 40, description: 'Total number of agents', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAgents?: number;

  @ApiProperty({ example: 'PRC-005', description: 'Pricing rule ID', required: false })
  @IsString()
  @IsOptional()
  pricingRuleId?: string;

  @ApiProperty({ example: 'Plastic - Lagos Premium', description: 'Pricing rule name', required: false })
  @IsString()
  @IsOptional()
  pricingRuleName?: string;

  @ApiProperty({ enum: SLATierEnum, example: 'platinum', description: 'SLA tier', required: false })
  @IsEnum(SLATierEnum)
  @IsOptional()
  slaTier?: string;

  @ApiProperty({ 
    description: 'Pickup availability windows',
    example: [{ day: 'Monday', startTime: '07:00', endTime: '18:00' }],
    required: false
  })
  @IsArray()
  @IsOptional()
  pickupAvailability?: Array<{ day: string; startTime: string; endTime: string }>;

  @ApiProperty({ example: true, description: 'Whether dropoff is eligible', required: false })
  @IsOptional()
  dropoffEligible?: boolean;

  @ApiProperty({ example: 85, description: 'Average pickups per day', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgPickupsPerDay?: number;

  @ApiProperty({ example: 42, description: 'Average dropoffs per day', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgDropoffsPerDay?: number;

  @ApiProperty({ enum: DemandIntensityEnum, example: 'high', description: 'Demand intensity', required: false })
  @IsEnum(DemandIntensityEnum)
  @IsOptional()
  demandIntensity?: string;

  @ApiProperty({ example: ['Dangote Industries', 'GTBank HQ'], description: 'Enterprise clients', required: false })
  @IsArray()
  @IsOptional()
  enterpriseClients?: string[];
}
