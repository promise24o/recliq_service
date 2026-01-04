import { Injectable, Inject } from '@nestjs/common';
import type { IBankAccountRepository } from '../../domain/repositories/wallet.repository';
import { BankAccount } from '../../domain/entities/bank-account.entity';

@Injectable()
export class SetDefaultBankAccountUseCase {
  constructor(
    @Inject('IBankAccountRepository')
    private readonly bankAccountRepository: IBankAccountRepository,
  ) {}

  async execute(data: {
    userId: string;
    bankAccountId: string;
  }): Promise<BankAccount> {
    // Find the bank account
    const bankAccount = await this.bankAccountRepository.findById(data.bankAccountId);
    
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    if (bankAccount.userId !== data.userId) {
      throw new Error('Unauthorized access to bank account');
    }

    if (!bankAccount.isActive) {
      throw new Error('Cannot set inactive bank account as default');
    }

    if (!bankAccount.canBeUsedForWithdrawal()) {
      throw new Error('Bank account is not ready for withdrawals');
    }

    // Unset current default
    await this.bankAccountRepository.unsetDefaultForUser(data.userId);

    // Set new default
    bankAccount.setAsDefault();
    await this.bankAccountRepository.update(bankAccount);

    return bankAccount;
  }
}
