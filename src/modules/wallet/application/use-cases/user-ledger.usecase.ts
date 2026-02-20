import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { WALLET_REPOSITORY_TOKEN } from '../../domain/repositories/wallet.repository.token';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import type { ITransactionRepository } from '../../domain/repositories/wallet.repository';
import { Wallet } from '../../domain/entities/wallet.entity';
import { 
  UserLedgerDto,
  GetUserLedgerQueryDto,
  TransactionDetailDto,
  FinancialMetricsDto,
  RewardBreakdownDto,
  WithdrawalSummaryDto,
  TransactionCategory,
  TransactionSource
} from '../../presentation/dto/user-ledger.dto';

@Injectable()
export class UserLedgerUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN) private readonly walletRepository: IWalletRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject('ITransactionRepository') private readonly transactionRepository: ITransactionRepository,
  ) {}

  async getUserLedger(userId: string, query: GetUserLedgerQueryDto): Promise<UserLedgerDto> {
    try {
      // Get user details
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Get or create wallet
      let wallet = await this.walletRepository.findByUserId(userId);
      if (!wallet) {
        wallet = Wallet.create(userId);
        await this.walletRepository.create(wallet);
      }

      // Get real transactions from database
      const allTransactions = await this.transactionRepository.findByUserId(userId, { limit: 1000 });
      
      // Convert to ledger format
      const ledgerTransactions = this.convertToLedgerTransactions(allTransactions);
      
      // Apply filters
      let filteredTransactions = this.applyTransactionFilters(ledgerTransactions, query);
      
      // Sort transactions
      filteredTransactions = this.sortTransactions(filteredTransactions, query.sortBy || 'date', query.sortOrder || 'desc');

      // Limit transactions if not requesting full history
      const transactions = query.includeFullHistory 
        ? filteredTransactions 
        : filteredTransactions.slice(0, query.transactionLimit);

      // Calculate financial metrics
      const financialMetrics = this.calculateFinancialMetrics(wallet, ledgerTransactions, user);

      // Calculate reward breakdown
      const rewardBreakdown = this.calculateRewardBreakdown(ledgerTransactions);

      // Calculate withdrawal summary
      const withdrawalSummary = this.calculateWithdrawalSummary(ledgerTransactions);

      return {
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        userEmail: user.email || 'unknown@example.com',
        userCity: user.city || undefined,
        kycStatus: this.mapKycStatusFromUserType(user.type),
        // Add full user details
        userDetails: {
          id: user.id,
          name: user.name,
          email: user.email || 'unknown@example.com',
          phone: user.phone,
          status: user.status,
          type: user.type,
          role: user.role,
          location: user.location,
          isVerified: user.isVerified,
          profilePhoto: user.profilePhoto,
          totalRecycles: user.totalRecycles,
          lastActivity: user.lastActivity,
          created: user.created
        },
        accountNumber: wallet.accountNumber || `ACC${userId.slice(-8)}`,
        accountName: wallet.accountName || user.name,
        financialMetrics,
        rewardBreakdown,
        withdrawalSummary,
        transactions,
        totalTransactions: ledgerTransactions.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating user ledger:', error);
      throw new BadRequestException('Failed to generate user ledger');
    }
  }

  private convertToLedgerTransactions(transactions: any[]): TransactionDetailDto[] {
    let runningBalance = 0;

    return transactions.map((tx, index) => {
      // Determine transaction category and source based on description and reference
      const { category, source } = this.categorizeTransaction(tx);
      
      // Update running balance
      runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;

      return {
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        category,
        source,
        description: tx.description || `${tx.type} transaction`,
        reference: tx.reference || `TXN_${tx.id}`,
        status: tx.status,
        runningBalance,
        relatedEntityId: this.extractRelatedEntityId(tx.reference || '', tx.description || ''),
        timestamp: tx.createdAt,
        processedAt: tx.createdAt,
        notes: tx.description || `${tx.type} transaction`
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private categorizeTransaction(transaction: any): { category: TransactionCategory; source: TransactionSource } {
    const description = transaction.description?.toLowerCase() || '';
    const reference = transaction.reference?.toLowerCase() || '';

    // Categorize based on description and reference patterns
    if (description.includes('recycling') || description.includes('pickup') || reference.includes('pickup')) {
      return {
        category: TransactionCategory.REWARD,
        source: TransactionSource.RECYCLING_PICKUP
      };
    }

    if (description.includes('referral') || reference.includes('ref')) {
      return {
        category: TransactionCategory.REFERRAL_BONUS,
        source: TransactionSource.REFERRAL_PROGRAM
      };
    }

    if (description.includes('withdrawal') || description.includes('bank') || reference.includes('withdraw')) {
      return {
        category: TransactionCategory.WITHDRAWAL,
        source: TransactionSource.BANK_TRANSFER
      };
    }

    if (description.includes('escrow') || description.includes('dispute') || reference.includes('escrow')) {
      if (transaction.type === 'debit') {
        return {
          category: TransactionCategory.ESCROW_HOLD,
          source: TransactionSource.DISPUTE_RESOLUTION
        };
      } else {
        return {
          category: TransactionCategory.ESCROW_RELEASE,
          source: TransactionSource.DISPUTE_RESOLUTION
        };
      }
    }

    if (description.includes('penalty') || description.includes('fee') || description.includes('fine')) {
      return {
        category: TransactionCategory.PENALTY,
        source: TransactionSource.SYSTEM_ADJUSTMENT
      };
    }

    if (description.includes('bonus') || description.includes('welcome') || description.includes('reward')) {
      return {
        category: TransactionCategory.REWARD,
        source: TransactionSource.SYSTEM_ADJUSTMENT
      };
    }

    // Default categorization
    if (transaction.type === 'credit') {
      return {
        category: TransactionCategory.REWARD,
        source: TransactionSource.SYSTEM_ADJUSTMENT
      };
    } else {
      return {
        category: TransactionCategory.WITHDRAWAL,
        source: TransactionSource.BANK_TRANSFER
      };
    }
  }

  private extractRelatedEntityId(reference: string, description: string): string | undefined {
    // Extract pickup ID, dispute ID, etc. from reference or description
    const pickupMatch = reference?.match(/PICKUP_(\d+)/) || description?.match(/pickup #?(\d+)/i);
    if (pickupMatch) return `PICKUP_${pickupMatch[1]}`;

    const disputeMatch = reference?.match(/DISPUTE_(\d+)/) || description?.match(/dispute #?(\d+)/i);
    if (disputeMatch) return `DISPUTE_${disputeMatch[1]}`;

    const refMatch = reference?.match(/REF_(\d+)/);
    if (refMatch) return `REFERRED_USER_${refMatch[1]}`;

    return undefined;
  }

  private applyTransactionFilters(transactions: TransactionDetailDto[], query: GetUserLedgerQueryDto): TransactionDetailDto[] {
    let filtered = [...transactions];

    // Filter by category
    if (query.category) {
      filtered = filtered.filter(tx => tx.category === query.category);
    }

    // Filter by date range
    if (query.dateFrom) {
      filtered = filtered.filter(tx => tx.timestamp >= query.dateFrom!);
    }

    if (query.dateTo) {
      filtered = filtered.filter(tx => tx.timestamp <= query.dateTo!);
    }

    return filtered;
  }

  private sortTransactions(transactions: TransactionDetailDto[], sortBy: string, sortOrder: string): TransactionDetailDto[] {
    const sorted = [...transactions];

    switch (sortBy) {
      case 'amount':
        return sortOrder === 'asc' 
          ? sorted.sort((a, b) => a.amount - b.amount)
          : sorted.sort((a, b) => b.amount - a.amount);
      case 'type':
        return sortOrder === 'asc'
          ? sorted.sort((a, b) => a.type.localeCompare(b.type))
          : sorted.sort((a, b) => b.type.localeCompare(a.type));
      case 'date':
      default:
        return sortOrder === 'asc'
          ? sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          : sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  }

  private calculateFinancialMetrics(wallet: Wallet, transactions: TransactionDetailDto[], user: any): FinancialMetricsDto {
    const totalEarnings = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalWithdrawn = transactions
      .filter(tx => tx.type === 'debit' && tx.category === TransactionCategory.WITHDRAWAL)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const escrowAmount = transactions
      .filter(tx => tx.category === TransactionCategory.ESCROW_HOLD)
      .reduce((sum, tx) => sum + tx.amount, 0) -
      transactions
      .filter(tx => tx.category === TransactionCategory.ESCROW_RELEASE)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const onHoldAmount = transactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const firstTransaction = transactions[transactions.length - 1];
    const accountCreatedDate = user.created || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year ago
    const daysActive = Math.floor((Date.now() - accountCreatedDate.getTime()) / (24 * 60 * 60 * 1000));
    const averageDailyEarnings = daysActive > 0 ? totalEarnings / daysActive : 0;

    return {
      totalEarnings,
      currentBalance: wallet.balance,
      escrowAmount: Math.max(0, escrowAmount),
      onHoldAmount,
      availableForWithdrawal: wallet.balance - Math.max(0, escrowAmount) - onHoldAmount,
      totalWithdrawn,
      netProfit: totalEarnings - totalWithdrawn,
      accountCreatedDate,
      firstTransactionDate: firstTransaction?.timestamp,
      daysActive,
      averageDailyEarnings,
    };
  }

  private calculateRewardBreakdown(transactions: TransactionDetailDto[]): RewardBreakdownDto {
    const recyclingRewards = transactions
      .filter(tx => tx.category === TransactionCategory.REWARD && tx.source === TransactionSource.RECYCLING_PICKUP)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const referralBonuses = transactions
      .filter(tx => tx.category === TransactionCategory.REFERRAL_BONUS)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const otherRewards = transactions
      .filter(tx => tx.category === TransactionCategory.REWARD && tx.source !== TransactionSource.RECYCLING_PICKUP)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const recyclingTransactions = transactions
      .filter(tx => tx.category === TransactionCategory.REWARD && tx.source === TransactionSource.RECYCLING_PICKUP)
      .length;

    const referralCount = transactions
      .filter(tx => tx.category === TransactionCategory.REFERRAL_BONUS)
      .length;

    const totalRewardTransactions = recyclingTransactions + referralCount;
    const averageRewardPerTransaction = totalRewardTransactions > 0 
      ? (recyclingRewards + referralBonuses) / totalRewardTransactions 
      : 0;

    return {
      recyclingRewards,
      referralBonuses,
      otherRewards,
      recyclingTransactions,
      referralCount,
      averageRewardPerTransaction,
    };
  }

  private calculateWithdrawalSummary(transactions: TransactionDetailDto[]): WithdrawalSummaryDto {
    const withdrawals = transactions
      .filter(tx => tx.category === TransactionCategory.WITHDRAWAL && tx.status === 'completed');

    const totalWithdrawn = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawalCount = withdrawals.length;
    const averageWithdrawalAmount = withdrawalCount > 0 ? totalWithdrawn / withdrawalCount : 0;

    const lastWithdrawal = withdrawals[0]; // Most recent (transactions are sorted newest first)

    return {
      totalWithdrawn,
      withdrawalCount,
      averageWithdrawalAmount,
      lastWithdrawalDate: lastWithdrawal?.timestamp,
      lastWithdrawalAmount: lastWithdrawal?.amount,
    };
  }

  private mapKycStatusFromUserType(userType: string): string {
    const statusMap: { [key: string]: string } = {
      'individual': 'approved',
      'enterprise': 'approved',
      'agent': 'approved',
    };
    return statusMap[userType] || 'not_started';
  }
}
