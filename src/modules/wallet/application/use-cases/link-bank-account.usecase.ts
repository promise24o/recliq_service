import { Injectable, Inject } from '@nestjs/common';
import type { IBankAccountRepository } from '../../domain/repositories/wallet.repository';
import { BankAccount } from '../../domain/entities/bank-account.entity';
import { BankAccountType } from '../../domain/enums/wallet.enum';
import { PaystackService } from '../../infrastructure/paystack/paystack.service';
import { BankAccountNotificationService } from '../../infrastructure/email/bank-account-notification.service';

@Injectable()
export class LinkBankAccountUseCase {
  constructor(
    @Inject('IBankAccountRepository')
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly paystackService: PaystackService,
    private readonly bankAccountNotificationService: BankAccountNotificationService,
  ) {}

  async execute(data: {
    userId: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
  }): Promise<BankAccount> {
    // Check if account already exists
    const existingAccount = await this.bankAccountRepository.findByAccountNumber(
      data.userId,
      data.accountNumber
    );

    if (existingAccount) {
      throw new Error('This bank account is already linked to your wallet');
    }

    // Create Paystack transfer recipient
    let recipientCode: string | undefined;
    try {
      const paystackResponse = await this.paystackService.createTransferRecipient({
        type: 'nuban',
        name: data.accountName,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
      });

      recipientCode = paystackResponse.data.recipient_code;
    } catch (error) {
      // Log error but don't fail the linking - user can retry later
      console.warn('Failed to create Paystack recipient:', error.message);
    }

    // Create bank account
    const bankAccount = BankAccount.create({
      userId: data.userId,
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      type: BankAccountType.SAVINGS, // Default to SAVINGS
      recipientCode,
    });

    // Set as default if it's the first account
    const userAccounts = await this.bankAccountRepository.findByUserId(data.userId);
    if (userAccounts.length === 0) {
      bankAccount.setAsDefault();
    }

    const createdBankAccount = await this.bankAccountRepository.create(bankAccount);

    // Send email notification
    await this.bankAccountNotificationService.sendBankAccountAddedEmail(
      data.userId,
      createdBankAccount
    );

    return createdBankAccount;
  }
}
