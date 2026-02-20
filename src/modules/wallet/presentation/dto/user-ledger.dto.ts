import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// Enums
export enum TransactionCategory {
  REWARD = 'reward',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  REFERRAL_BONUS = 'referral_bonus',
  PENALTY = 'penalty',
  ADJUSTMENT = 'adjustment',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_HOLD = 'escrow_hold'
}

export enum TransactionSource {
  RECYCLING_PICKUP = 'recycling_pickup',
  BANK_TRANSFER = 'bank_transfer',
  REFERRAL_PROGRAM = 'referral_program',
  SYSTEM_ADJUSTMENT = 'system_adjustment',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  MANUAL_ADJUSTMENT = 'manual_adjustment'
}

// Transaction Detail DTO
export class TransactionDetailDto {
  @ApiProperty({ description: 'Transaction unique identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Transaction type' })
  @IsEnum(['credit', 'debit'])
  type: 'credit' | 'debit';

  @ApiProperty({ description: 'Transaction amount in NGN' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Transaction category' })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ description: 'Transaction source' })
  @IsEnum(TransactionSource)
  source: TransactionSource;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Reference number' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Transaction status' })
  @IsEnum(['completed', 'pending', 'failed', 'cancelled'])
  status: 'completed' | 'pending' | 'failed' | 'cancelled';

  @ApiProperty({ description: 'Running balance after transaction' })
  @IsNumber()
  runningBalance: number;

  @ApiProperty({ description: 'Related entity ID (pickup, dispute, etc.)' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiProperty({ description: 'Transaction timestamp' })
  @IsDate()
  timestamp: Date;

  @ApiProperty({ description: 'Processing date' })
  @IsOptional()
  @IsDate()
  processedAt?: Date;

  @ApiProperty({ description: 'Notes or comments' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Reward Breakdown DTO
export class RewardBreakdownDto {
  @ApiProperty({ description: 'Total recycling rewards' })
  @IsNumber()
  recyclingRewards: number;

  @ApiProperty({ description: 'Total referral bonuses' })
  @IsNumber()
  referralBonuses: number;

  @ApiProperty({ description: 'Total other rewards' })
  @IsNumber()
  otherRewards: number;

  @ApiProperty({ description: 'Number of recycling transactions' })
  @IsNumber()
  recyclingTransactions: number;

  @ApiProperty({ description: 'Number of referrals' })
  @IsNumber()
  referralCount: number;

  @ApiProperty({ description: 'Average reward per transaction' })
  @IsNumber()
  averageRewardPerTransaction: number;
}

// Withdrawal Summary DTO
export class WithdrawalSummaryDto {
  @ApiProperty({ description: 'Total amount withdrawn' })
  @IsNumber()
  totalWithdrawn: number;

  @ApiProperty({ description: 'Number of withdrawals' })
  @IsNumber()
  withdrawalCount: number;

  @ApiProperty({ description: 'Average withdrawal amount' })
  @IsNumber()
  averageWithdrawalAmount: number;

  @ApiProperty({ description: 'Last withdrawal date' })
  @IsOptional()
  @IsDate()
  lastWithdrawalDate?: Date;

  @ApiProperty({ description: 'Last withdrawal amount' })
  @IsOptional()
  @IsNumber()
  lastWithdrawalAmount?: number;
}

// Financial Metrics DTO
export class FinancialMetricsDto {
  @ApiProperty({ description: 'Total earnings all time' })
  @IsNumber()
  totalEarnings: number;

  @ApiProperty({ description: 'Current wallet balance' })
  @IsNumber()
  currentBalance: number;

  @ApiProperty({ description: 'Amount in escrow' })
  @IsNumber()
  escrowAmount: number;

  @ApiProperty({ description: 'Amount on hold' })
  @IsNumber()
  onHoldAmount: number;

  @ApiProperty({ description: 'Available for withdrawal' })
  @IsNumber()
  availableForWithdrawal: number;

  @ApiProperty({ description: 'Total withdrawn all time' })
  @IsNumber()
  totalWithdrawn: number;

  @ApiProperty({ description: 'Net profit (earnings - withdrawals)' })
  @IsNumber()
  netProfit: number;

  @ApiProperty({ description: 'Account creation date' })
  @IsDate()
  accountCreatedDate: Date;

  @ApiProperty({ description: 'First transaction date' })
  @IsOptional()
  @IsDate()
  firstTransactionDate?: Date;

  @ApiProperty({ description: 'Days active as user' })
  @IsNumber()
  daysActive: number;

  @ApiProperty({ description: 'Average daily earnings' })
  @IsNumber()
  averageDailyEarnings: number;
}

// Main User Ledger DTO
export class UserLedgerDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  userName: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  userPhone: string;

  @ApiProperty({ description: 'User email' })
  @IsString()
  userEmail: string;

  @ApiProperty({ description: 'User city' })
  @IsOptional()
  @IsString()
  userCity?: string;

  @ApiProperty({ description: 'KYC status' })
  @IsEnum(['not_started', 'submitted', 'under_review', 'approved', 'rejected', 'expired'])
  kycStatus: string;

  @ApiProperty({ description: 'Full user details' })
  userDetails: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    type: string;
    role: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    isVerified: boolean;
    profilePhoto?: string;
    totalRecycles: number;
    lastActivity: Date;
    created: Date;
  };

  @ApiProperty({ description: 'Wallet account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Wallet account name' })
  @IsString()
  accountName: string;

  @ApiProperty({ description: 'Financial metrics summary' })
  financialMetrics: FinancialMetricsDto;

  @ApiProperty({ description: 'Reward breakdown' })
  rewardBreakdown: RewardBreakdownDto;

  @ApiProperty({ description: 'Withdrawal summary' })
  withdrawalSummary: WithdrawalSummaryDto;

  @ApiProperty({ description: 'Recent transactions' })
  transactions: TransactionDetailDto[];

  @ApiProperty({ description: 'Total transaction count' })
  @IsNumber()
  totalTransactions: number;

  @ApiProperty({ description: 'Ledger generation timestamp' })
  @IsDate()
  generatedAt: Date;
}

// Query DTO for filtering
export class GetUserLedgerQueryDto {
  @ApiProperty({ description: 'Include full transaction history', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeFullHistory?: boolean = false;

  @ApiProperty({ description: 'Number of recent transactions to return', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : 50)
  @IsNumber()
  transactionLimit?: number = 50;

  @ApiProperty({ description: 'Filter by transaction category', required: false })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiProperty({ description: 'Filter by date from', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  @IsDate()
  dateFrom?: Date;

  @ApiProperty({ description: 'Filter by date to', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  @IsDate()
  dateTo?: Date;

  @ApiProperty({ description: 'Sort transactions by', required: false })
  @IsOptional()
  @IsEnum(['date', 'amount', 'type'])
  sortBy?: 'date' | 'amount' | 'type' = 'date';

  @ApiProperty({ description: 'Sort order', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
