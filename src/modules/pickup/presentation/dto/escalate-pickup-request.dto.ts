import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EscalatePickupRequestDto {
  @ApiProperty({ example: 'ops_lead', description: 'Role or person to escalate to' })
  @IsString()
  @IsNotEmpty()
  escalatedTo: string;
}
