import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class SplitZoneDto {
  @ApiProperty({ example: 'ZN-123456', description: 'Zone ID to split' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({ 
    description: 'First new zone data',
    example: {
      name: 'Lekki Phase 1',
      description: 'Lekki Phase 1 and VGC area',
      polygon: [{ lat: 6.4400, lng: 3.4700 }, { lat: 6.4500, lng: 3.5200 }],
      centerLat: 6.4350,
      centerLng: 3.5150,
      areaKm2: 15.2,
      totalAgents: 20,
      pricingRuleId: 'PRC-005',
      pricingRuleName: 'Plastic - Lagos Premium',
      slaTier: 'platinum',
      coverageLevel: 'high',
      demandIntensity: 'high',
      pickupAvailability: [{ day: 'Monday', startTime: '07:00', endTime: '18:00' }],
      dropoffEligible: true,
      enterpriseClients: ['Dangote Industries']
    }
  })
  @IsNotEmpty()
  zone1: {
    name: string;
    description: string;
    polygon: Array<{ lat: number; lng: number }>;
    centerLat: number;
    centerLng: number;
    areaKm2: number;
    totalAgents: number;
    pricingRuleId: string;
    pricingRuleName: string;
    slaTier: string;
    coverageLevel: string;
    demandIntensity: string;
    pickupAvailability: Array<{ day: string; startTime: string; endTime: string }>;
    dropoffEligible: boolean;
    enterpriseClients?: string[];
  };

  @ApiProperty({ 
    description: 'Second new zone data',
    example: {
      name: 'Lekki Phase 2',
      description: 'Lekki Phase 2 and Ajah corridor',
      polygon: [{ lat: 6.4500, lng: 3.5200 }, { lat: 6.4600, lng: 3.5700 }],
      centerLat: 6.4550,
      centerLng: 3.5450,
      areaKm2: 18.7,
      totalAgents: 15,
      pricingRuleId: 'PRC-005',
      pricingRuleName: 'Plastic - Lagos Premium',
      slaTier: 'gold',
      coverageLevel: 'medium',
      demandIntensity: 'medium',
      pickupAvailability: [{ day: 'Monday', startTime: '07:00', endTime: '18:00' }],
      dropoffEligible: true,
      enterpriseClients: ['GTBank HQ']
    }
  })
  @IsNotEmpty()
  zone2: {
    name: string;
    description: string;
    polygon: Array<{ lat: number; lng: number }>;
    centerLat: number;
    centerLng: number;
    areaKm2: number;
    totalAgents: number;
    pricingRuleId: string;
    pricingRuleName: string;
    slaTier: string;
    coverageLevel: string;
    demandIntensity: string;
    pickupAvailability: Array<{ day: string; startTime: string; endTime: string }>;
    dropoffEligible: boolean;
    enterpriseClients?: string[];
  };

  @ApiProperty({ 
    description: 'How to distribute agents between zones',
    example: { zone1Agents: 20, zone2Agents: 15 }
  })
  @IsNotEmpty()
  agentDistribution: {
    zone1Agents: number;
    zone2Agents: number;
  };

  @ApiProperty({ 
    description: 'Reason for splitting the zone',
    example: 'High demand in Phase 1 requires dedicated coverage'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
