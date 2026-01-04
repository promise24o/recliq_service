import { ApiProperty } from '@nestjs/swagger';

export class ModernWalletCardDto {
  @ApiProperty({
    description: 'Available balance in the wallet (in kobo/cents)',
    example: 300000,
    type: Number,
  })
  availableBalance: number;

  @ApiProperty({
    description: 'Total earnings for today (in kobo/cents)',
    example: 10000,
    type: Number,
  })
  todayEarnings: number;

  @ApiProperty({
    description: 'Amount of last withdrawal (in kobo/cents)',
    example: 20000,
    type: Number,
    nullable: true,
  })
  lastWithdrawnAmount: number | null;

  @ApiProperty({
    description: 'Unique account number for the wallet',
    example: '3447838348',
    type: String,
    nullable: true,
  })
  accountNumber: string | null;

  @ApiProperty({
    description: 'Account holder name',
    example: 'JOHN DOE',
    type: String,
    nullable: true,
  })
  accountName: string | null;

  @ApiProperty({
    description: 'Total earnings accumulated (in kobo/cents)',
    example: 500000,
    type: Number,
  })
  totalEarnings: number;

  @ApiProperty({
    description: 'Date of last transaction',
    example: '2025-01-04T06:30:00.000Z',
    type: String,
    nullable: true,
  })
  lastTransactionDate: string | null;
}
