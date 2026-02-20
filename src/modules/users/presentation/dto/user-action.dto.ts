import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserAction } from '../../domain/types/user.types';

export class UserActionDto {
  @ApiProperty({ enum: UserAction, description: 'Action to perform on user' })
  @IsEnum(UserAction)
  action: UserAction;

  @ApiProperty({ required: false, description: 'Reason for the action' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false, description: 'Additional notes about the action' })
  @IsOptional()
  @IsString()
  notes?: string;
}
