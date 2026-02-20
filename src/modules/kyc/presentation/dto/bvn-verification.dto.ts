import { ApiProperty } from '@nestjs/swagger';

export class BvnVerificationDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  userId: string;

  @ApiProperty({
    description: 'Bank Verification Number (11 digits)',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  bvn: string;

  @ApiProperty({
    description: 'Bank account number (10 digits)',
    example: '0123456789',
    minLength: 10,
    maxLength: 10,
  })
  accountNumber: string;

  @ApiProperty({
    description: 'Bank code',
    example: '044',
  })
  bankCode: string;

  @ApiProperty({
    description: 'User full name (must match bank account name)',
    example: 'John Doe',
  })
  userName: string;
}

export class AccountResolutionDto {
  @ApiProperty({
    description: 'Bank account number',
    example: '0123456789',
  })
  accountNumber: string;

  @ApiProperty({
    description: 'Bank code',
    example: '044',
  })
  bankCode: string;
}
