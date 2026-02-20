import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiProperty({ example: '+234 801 234 5678', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
