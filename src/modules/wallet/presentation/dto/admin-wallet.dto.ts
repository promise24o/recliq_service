import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum WalletStatus {
  NORMAL = 'normal',
  LOCKED = 'locked',
  COMPLIANCE_HOLD = 'compliance_hold',
  NEGATIVE_BALANCE = 'negative_balance',
  HIGH_RISK = 'high_risk'
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  LOCK = 'lock',
  RELEASE = 'release'
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed'
}

export class WalletTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiProperty({ description: 'Transaction timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Transaction reference' })
  reference: string;

  @ApiProperty({ enum: TransactionStatus, description: 'Transaction status' })
  status: TransactionStatus;
}

export class UserWalletDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User ID (internal reference)' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User phone' })
  phone: string;

  @ApiProperty({ description: 'User city' })
  city: string;

  @ApiProperty({ enum: KYCStatus, description: 'KYC status' })
  kycStatus: KYCStatus;

  @ApiProperty({ description: 'Available balance' })
  availableBalance: number;

  @ApiProperty({ description: 'Pending escrow amount' })
  pendingEscrow: number;

  @ApiProperty({ description: 'Amount on hold' })
  onHold: number;

  @ApiProperty({ description: 'Lifetime earned amount' })
  lifetimeEarned: number;

  @ApiProperty({ description: 'Lifetime withdrawn amount' })
  lifetimeWithdrawn: number;

  @ApiProperty({ enum: WalletStatus, description: 'Wallet status' })
  walletStatus: WalletStatus;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: string;

  @ApiProperty({ type: [WalletTransactionDto], description: 'Recent transactions' })
  transactions: WalletTransactionDto[];
}

export class WalletSummaryDto {
  @ApiProperty({ description: 'Total user balances' })
  totalUserBalances: number;

  @ApiProperty({ description: 'Total amount in escrow' })
  totalInEscrow: number;

  @ApiProperty({ description: 'Total amount on hold' })
  totalOnHold: number;

  @ApiProperty({ description: 'Available for withdrawal' })
  availableForWithdrawal: number;

  @ApiProperty({ description: 'Lifetime rewards issued' })
  lifetimeRewardsIssued: number;

  @ApiProperty({ description: 'Number of wallets with issues' })
  walletsWithIssues: number;
}

export class AdminWalletListResponseDto {
  @ApiProperty({ type: [UserWalletDto], description: 'List of user wallets' })
  data: UserWalletDto[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminWalletSummaryResponseDto {
  @ApiProperty({ type: WalletSummaryDto, description: 'Wallet summary statistics' })
  summary: WalletSummaryDto;
}

export class GetAdminWalletsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Search term for name, phone, or user ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WalletStatus, description: 'Filter by wallet status' })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ enum: KYCStatus, description: 'Filter by KYC status' })
  @IsOptional()
  @IsEnum(KYCStatus)
  kycStatus?: KYCStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class ExportWalletsQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'pdf'], description: 'Export format' })
  @IsOptional()
  @IsEnum(['csv', 'pdf'])
  format?: 'csv' | 'pdf' = 'csv';

  @ApiPropertyOptional({ description: 'Filter by wallet status' })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiPropertyOptional({ description: 'Filter by KYC status' })
  @IsOptional()
  @IsEnum(KYCStatus)
  kycStatus?: KYCStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}
