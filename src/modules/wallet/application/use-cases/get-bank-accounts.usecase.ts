import { Injectable, Inject } from '@nestjs/common';
import type { IBankAccountRepository } from '../../domain/repositories/wallet.repository';
import { BankAccount } from '../../domain/entities/bank-account.entity';

@Injectable()
export class GetBankAccountsUseCase {
  constructor(
    @Inject('IBankAccountRepository')
    private readonly bankAccountRepository: IBankAccountRepository,
  ) {}

  async execute(userId: string): Promise<BankAccount[]> {
    return await this.bankAccountRepository.findByUserId(userId);
  }
}
