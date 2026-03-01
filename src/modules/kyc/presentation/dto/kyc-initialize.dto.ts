import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { KycUserType } from '../../domain/types/kyc.types';

export class KycInitializeDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'User type selection',
    enum: KycUserType,
    example: KycUserType.INDIVIDUAL,
  })
  @IsEnum(KycUserType)
  @IsNotEmpty()
  userType: KycUserType;
}
