import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PickupModeEnum, MatchTypeEnum, WasteTypeEnum } from '../../domain/constants/pickup.constants';

class CoordinatesDto {
  @ApiProperty({ example: 6.4524, description: 'Latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 3.4158, description: 'Longitude' })
  @IsNumber()
  lng: number;
}

export class CreatePickupRequestDto {

  @ApiProperty({ enum: PickupModeEnum, example: 'pickup', description: 'Pickup mode - agent goes to user or user goes to agent' })
  @IsEnum(PickupModeEnum)
  @IsNotEmpty()
  pickupMode: 'pickup' | 'dropoff';

  @ApiProperty({ enum: MatchTypeEnum, example: 'auto', description: 'How the agent is matched - auto or user selected' })
  @IsEnum(MatchTypeEnum)
  @IsNotEmpty()
  matchType: 'auto' | 'user_selected';

  @ApiProperty({ enum: WasteTypeEnum, example: 'plastic', description: 'Type of waste for pickup' })
  @IsEnum(WasteTypeEnum)
  @IsNotEmpty()
  wasteType: 'plastic' | 'paper' | 'metal' | 'glass' | 'organic' | 'e_waste' | 'mixed';

  @ApiProperty({ example: 5.2, description: 'Estimated weight in kg' })
  @IsNumber()
  @Min(0.1)
  estimatedWeight: number;

  @ApiProperty({ type: CoordinatesDto, description: 'Pickup location coordinates' })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;

  @ApiProperty({ example: '123 Awolowo Road, Ikoyi', description: 'Pickup address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Gate code: #1234', description: 'Additional notes for the pickup', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'AGT001', description: 'Agent ID when match type is user_selected', required: false })
  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @ApiProperty({ example: 'Samuel Kamau', description: 'Agent name when match type is user_selected', required: false })
  @IsString()
  @IsOptional()
  assignedAgentName?: string;
}
