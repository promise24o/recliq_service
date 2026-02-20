import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class MergeZonesDto {
  @ApiProperty({ 
    description: 'Zone IDs to merge',
    example: ['ZN-123456', 'ZN-789012']
  })
  @IsArray()
  @IsNotEmpty()
  zoneIds: string[];

  @ApiProperty({ 
    description: 'Merged zone data',
    example: {
      name: 'Lekki Consolidated',
      description: 'Merged Lekki Phase 1 and Phase 2 zones',
      polygon: [{ lat: 6.4400, lng: 3.4700 }, { lat: 6.4600, lng: 3.5700 }],
      centerLat: 6.4500,
      centerLng: 3.5200,
      areaKm2: 33.9,
      totalAgents: 35,
      pricingRuleId: 'PRC-005',
      pricingRuleName: 'Plastic - Lagos Premium',
      slaTier: 'platinum',
      coverageLevel: 'high',
      demandIntensity: 'high',
      pickupAvailability: [{ day: 'Monday', startTime: '07:00', endTime: '18:00' }],
      dropoffEligible: true,
      enterpriseClients: ['Dangote Industries', 'GTBank HQ']
    }
  })
  @IsNotEmpty()
  mergedZone: {
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
    description: 'Reason for merging zones',
    example: 'Optimize coverage and reduce operational overhead'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ 
    description: 'How to handle existing contracts and pricing',
    example: 'keep_highest_tier'
  })
  @IsString()
  @IsNotEmpty()
  contractHandling: 'keep_highest_tier' | 'create_new_rules' | 'preserve_existing';
}
