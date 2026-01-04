import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository, ITransactionRepository, IBankAccountRepository } from '../../domain/repositories/wallet.repository';
import { Wallet } from '../../domain/entities/wallet.entity';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '../../domain/enums/wallet.enum';
import { PaystackService } from '../../infrastructure/paystack/paystack.service';

@Injectable()
export class WithdrawUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IBankAccountRepository')
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly paystackService: PaystackService,
  ) {}

  async execute(data: {
    userId: string;
    amount: number;
    bankAccountId?: string;
    reason?: string;
  }): Promise<{
    message: string;
    reference: string;
    status: string;
    estimatedCompletionTime: string;
  }> {
    // Get user's wallet
    let wallet = await this.walletRepository.findByUserId(data.userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check sufficient balance
    if (!wallet.hasSufficientBalance(data.amount)) {
      throw new Error('Insufficient balance');
    }

    // Get bank account
    let bankAccount;
    if (data.bankAccountId) {
      bankAccount = await this.bankAccountRepository.findById(data.bankAccountId);
      if (!bankAccount || bankAccount.userId !== data.userId) {
        throw new Error('Bank account not found');
      }
    } else {
      // Use default bank account
      bankAccount = await this.bankAccountRepository.findDefaultByUserId(data.userId);
      if (!bankAccount) {
        throw new Error('No default bank account found. Please link a bank account first.');
      }
    }

    if (!bankAccount.canBeUsedForWithdrawal()) {
      throw new Error('Bank account is not ready for withdrawals');
    }

    // Create withdrawal transaction
    const transaction = Transaction.create({
      userId: data.userId,
      type: TransactionType.WITHDRAWAL,
      amount: data.amount,
      description: data.reason || `Withdrawal to ${bankAccount.bankName}`,
      reference: this.generateReference(),
      metadata: {
        bankAccountId: bankAccount.id,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
      },
    });

    await this.transactionRepository.create(transaction);

    try {
      // Debit wallet
      wallet.debit(data.amount);
      await this.walletRepository.update(wallet);

      // Initiate Paystack transfer
      const paystackResponse = await this.paystackService.initiateTransfer({
        source: 'balance',
        amount: data.amount * 100, // Convert to kobo
        recipient: bankAccount.recipientCode!,
        reason: data.reason,
      });

      // Update transaction with Paystack reference
      transaction.markAsSuccessful();
      await this.transactionRepository.update(transaction);

      return {
        message: 'Withdrawal initiated successfully',
        reference: paystackResponse.data.reference,
        status: 'pending',
        estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    } catch (error) {
      // Refund wallet if transfer fails
      wallet.credit(data.amount, 'Withdrawal refund');
      await this.walletRepository.update(wallet);

      transaction.markAsFailed(error.message);
      await this.transactionRepository.update(transaction);

      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  private generateReference(): string {
    return `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
