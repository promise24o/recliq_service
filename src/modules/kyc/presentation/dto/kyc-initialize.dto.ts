import { ApiProperty } from '@nestjs/swagger';
import { KycUserType } from '../../domain/types/kyc.types';

export class KycInitializeDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  userId: string;

  @ApiProperty({
    description: 'User type selection',
    enum: KycUserType,
    example: KycUserType.INDIVIDUAL,
  })
  userType: KycUserType;
}
