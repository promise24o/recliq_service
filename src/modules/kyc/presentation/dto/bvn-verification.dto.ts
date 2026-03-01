import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, MinLength, MaxLength } from 'class-validator';

export class BvnVerificationDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Bank Verification Number (11 digits)',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  @Matches(/^[0-9]{11}$/, { message: 'BVN must be exactly 11 digits' })
  bvn: string;

  @ApiProperty({
    description: 'Bank account number (10 digits)',
    example: '0123456789',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10)
  @Matches(/^[0-9]{10}$/, { message: 'Account number must be exactly 10 digits' })
  accountNumber: string;

  @ApiProperty({
    description: 'Bank code',
    example: '044',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[0-9]{3}$/, { message: 'Bank code must be exactly 3 digits' })
  bankCode: string;

  @ApiProperty({
    description: 'User full name (must match bank account name)',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  userName: string;
}

export class AccountResolutionDto {
  @ApiProperty({
    description: 'Bank account number',
    example: '0123456789',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10)
  @Matches(/^[0-9]{10}$/, { message: 'Account number must be exactly 10 digits' })
  accountNumber: string;

  @ApiProperty({
    description: 'Bank code',
    example: '044',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(3)
  @Matches(/^[0-9]{3}$/, { message: 'Bank code must be exactly 3 digits' })
  bankCode: string;
}
