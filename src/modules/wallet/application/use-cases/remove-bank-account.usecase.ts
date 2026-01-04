import { Injectable, Inject } from '@nestjs/common';
import type { IBankAccountRepository } from '../../domain/repositories/wallet.repository';
import { BankAccount } from '../../domain/entities/bank-account.entity';
import { BankAccountNotificationService } from '../../infrastructure/email/bank-account-notification.service';

@Injectable()
export class RemoveBankAccountUseCase {
  constructor(
    @Inject('IBankAccountRepository')
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly bankAccountNotificationService: BankAccountNotificationService,
  ) {}

  async execute(data: {
    userId: string;
    bankAccountId: string;
  }): Promise<void> {
    // Find the bank account
    const bankAccount = await this.bankAccountRepository.findById(data.bankAccountId);
    
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (bankAccount.userId !== data.userId) {
      throw new Error('Unauthorized access to bank account');
    }

    if (bankAccount.isDefault) {
      throw new Error('Cannot remove default bank account. Please set another account as default first.');
    }

    await this.bankAccountRepository.delete(data.bankAccountId, data.userId);

    // Send email notification
    await this.bankAccountNotificationService.sendBankAccountRemovedEmail(
      data.userId,
      bankAccount
    );
  }
}
