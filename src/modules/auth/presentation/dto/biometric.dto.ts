import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BiometricDto {
  @ApiProperty({ 
    description: 'Enable or disable biometric access', 
    example: true
  })
  @IsBoolean()
  enabled: boolean;
}
