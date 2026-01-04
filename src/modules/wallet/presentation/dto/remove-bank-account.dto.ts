import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RemoveBankAccountDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Bank account ID to remove'
  })
  @IsString()
  bankAccountId: string;
}
