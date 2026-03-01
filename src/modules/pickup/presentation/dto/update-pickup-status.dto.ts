import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { PickupStatusEnum } from '../../domain/constants/pickup.constants';

export class UpdatePickupStatusDto {
  @ApiProperty({ enum: PickupStatusEnum, example: 'agent_en_route', description: 'New status for the pickup request' })
  @IsEnum(PickupStatusEnum)
  @IsNotEmpty()
  status: string;
}
