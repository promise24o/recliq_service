import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionStatus, BankAccountType, EarningsPeriod } from '../../domain/enums/wallet.enum';

// Wallet Response DTOs
export class WalletResponseDto {
  @ApiProperty({ example: '6956cd1d842c6afdc694d3fe' })
  id: string;

  @ApiProperty({ example: 1500.50 })
  balance: number;

  @ApiProperty({ example: 5000.00 })
  totalEarnings: number;

  @ApiProperty({ example: 150.00 })
  todayEarnings: number;

  @ApiProperty({ example: '2026-01-01T19:38:05.542Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-02T10:57:10.765Z' })
  updatedAt: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EARNING })
  type: TransactionType;

  @ApiProperty({ example: 150.00 })
  amount: number;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.SUCCESSFUL })
  status: TransactionStatus;

  @ApiProperty({ example: 'PET bottle collection' })
  description: string;

  @ApiProperty({ example: 'TXN_123456789', required: false })
  reference?: string;

  @ApiProperty({ example: '2026-01-01T19:38:05.542Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-01-01T19:38:05.542Z', required: false })
  completedAt?: string;
}

export class BankAccountResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Guaranty Trust Bank' })
  bankName: string;

  @ApiProperty({ example: '058' })
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  accountNumber: string;

  @ApiProperty({ example: 'John Doe' })
  accountName: string;

  @ApiProperty({ enum: BankAccountType, example: BankAccountType.SAVINGS })
  type: BankAccountType;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-01T19:38:05.542Z' })
  createdAt: string;
}

// Request DTOs
export class GetTransactionsDto {
  @ApiProperty({ 
    description: 'Filter by transaction type', 
    enum: TransactionType,
    required: false
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({ 
    description: 'Filter by status', 
    enum: TransactionStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({ 
    description: 'Number of transactions to return', 
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Number of transactions to skip', 
    required: false,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class GetEarningsSummaryDto {
  @ApiProperty({ 
    description: 'Earnings period', 
    enum: EarningsPeriod,
    required: false,
    default: EarningsPeriod.ALL_TIME
  })
  @IsOptional()
  @IsEnum(EarningsPeriod)
  period?: EarningsPeriod = EarningsPeriod.ALL_TIME;
}

export class LinkBankAccountDto {
  @ApiProperty({ example: '058' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  accountNumber: string;
}

export class VerifyBankAccountDto {
  @ApiProperty({ example: '058' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  accountNumber: string;
}

export class SetDefaultBankAccountDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  bankAccountId: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ 
    description: 'Bank account ID to withdraw to', 
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiProperty({ 
    description: 'Withdrawal reason', 
    example: 'Weekly withdrawal',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmBankAccountDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

export class RemoveBankAccountDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

// Response DTOs for specific endpoints
export class EarningsSummaryResponseDto {
  @ApiProperty({ example: 1500.00 })
  total: number;

  @ApiProperty({ example: 25 })
  count: number;

  @ApiProperty({ 
    example: { date: '2026-01-01', amount: 500.00 },
    required: false
  })
  bestDay?: { date: string; amount: number };
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];

  @ApiProperty({ example: true })
  hasMore: boolean;

  @ApiProperty({ example: 50 })
  total: number;
}

export class BankAccountListResponseDto {
  @ApiProperty({ type: [BankAccountResponseDto] })
  bankAccounts: BankAccountResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;
}

export class WithdrawalResponseDto {
  @ApiProperty({ example: 'Withdrawal initiated successfully' })
  message: string;

  @ApiProperty({ example: 'TXN_123456789' })
  reference: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: '2026-01-01T19:38:05.542Z' })
  estimatedCompletionTime: string;
}

export class BankVerificationResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'John Doe' })
  accountName: string;

  @ApiProperty({ example: '0123456789' })
  accountNumber: string;

  @ApiProperty({ example: 'Guaranty Trust Bank' })
  bankName: string;

  @ApiProperty({ example: '058' })
  bankCode: string;
}

export class BanksListResponseDto {
  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Guaranty Trust Bank' },
        code: { type: 'string', example: '058' }
      }
    }
  })
  banks: Array<{ name: string; code: string }>;
}
