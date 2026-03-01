import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelPickupRequestDto {
  @ApiPropertyOptional({ 
    example: 'User requested cancellation - no longer needs pickup', 
    description: 'Reason for cancellation. Required if agent has already accepted the pickup.' 
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
