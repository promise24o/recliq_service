import { Injectable, Inject } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/wallet.repository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '../../domain/enums/wallet.enum';

@Injectable()
export class GetTransactionsUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(data: {
    userId: string;
    type?: TransactionType;
    status?: TransactionStatus;
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: Transaction[];
    hasMore: boolean;
    total: number;
  }> {
    const limit = data.limit || 20;
    const offset = data.offset || 0;

    const transactions = await this.transactionRepository.findByUserId(data.userId, {
      type: data.type,
      status: data.status,
      limit: limit + 1, // Get one extra to check if there are more
      offset,
    });

    const hasMore = transactions.length > limit;
    const resultTransactions = hasMore ? transactions.slice(0, limit) : transactions;

    // Get total count (simplified - in production you'd add a count method)
    const total = await this.getTotalCount(data.userId, data.type, data.status);

    return {
      transactions: resultTransactions,
      hasMore,
      total,
    };
  }

  private async getTotalCount(
    userId: string, 
    type?: TransactionType, 
    status?: TransactionStatus
  ): Promise<number> {
    // For now, we'll return a simplified count
    // In a real implementation, you'd add a count method to the repository
    const allTransactions = await this.transactionRepository.findByUserId(userId, {
      type,
      status,
      limit: 1000, // Reasonable limit for count
    });
    return allTransactions.length;
  }
}
