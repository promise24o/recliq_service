import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export enum AgentResponseType {
  ACCEPT = 'accept',
  DECLINE = 'decline',
}

export class AgentRespondToPickupDto {
  @ApiProperty({ 
    enum: AgentResponseType, 
    example: 'accept', 
    description: 'Agent response: accept or decline the pickup request' 
  })
  @IsEnum(AgentResponseType)
  @IsNotEmpty()
  response: AgentResponseType;

  @ApiPropertyOptional({ 
    example: 'Too far from my current location', 
    description: 'Reason for declining (required when declining)' 
  })
  @ValidateIf(o => o.response === AgentResponseType.DECLINE)
  @IsString()
  @IsNotEmpty({ message: 'Reason is required when declining a pickup request' })
  reason?: string;

  @ApiPropertyOptional({ 
    example: 15, 
    description: 'Estimated arrival time in minutes (optional when accepting)' 
  })
  @IsOptional()
  estimatedArrivalMinutes?: number;
}
