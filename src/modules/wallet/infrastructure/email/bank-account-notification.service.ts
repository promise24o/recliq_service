import { Injectable, Inject } from '@nestjs/common';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { BankAccount } from '../../domain/entities/bank-account.entity';

@Injectable()
export class BankAccountNotificationService {
  constructor(
    private readonly emailQueueService: EmailQueueService,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async sendBankAccountAddedEmail(userId: string, bankAccount: BankAccount): Promise<void> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user || !user.email) {
        return; // Skip if user not found or no email
      }

      const userEmail = user.email.getValue();
      
      await this.emailQueueService.addEmailJob({
        to: userEmail,
        subject: 'Bank Account Added Successfully',
        template: 'bank-account-added',
        payload: {
          userName: user.name,
          bankName: bankAccount.bankName,
          accountNumber: this.maskAccountNumber(bankAccount.accountNumber),
          accountName: bankAccount.accountName,
          isDefault: bankAccount.isDefault,
          addedAt: bankAccount.createdAt.toISOString(),
        },
        priority: EmailPriority.MEDIUM,
        idempotencyKey: `bank-account-added-${userId}-${bankAccount.id}-${Date.now()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to send bank account added email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async sendBankAccountRemovedEmail(userId: string, bankAccount: BankAccount): Promise<void> {
    try {
      const user = await this.authRepository.findById(userId);
      if (!user || !user.email) {
        return; // Skip if user not found or no email
      }

      const userEmail = user.email.getValue();
      
      await this.emailQueueService.addEmailJob({
        to: userEmail,
        subject: 'Bank Account Removed',
        template: 'bank-account-removed',
        payload: {
          userName: user.name,
          bankName: bankAccount.bankName,
          accountNumber: this.maskAccountNumber(bankAccount.accountNumber),
          accountName: bankAccount.accountName,
          removedAt: new Date().toISOString(),
        },
        priority: EmailPriority.MEDIUM,
        idempotencyKey: `bank-account-removed-${userId}-${bankAccount.id}-${Date.now()}`,
        retryCount: 0,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to send bank account removed email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    const start = accountNumber.substring(0, 2);
    const end = accountNumber.substring(accountNumber.length - 4);
    const middle = '*'.repeat(accountNumber.length - 6);
    return `${start}${middle}${end}`;
  }
}
