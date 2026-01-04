import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import { Wallet } from '../../domain/entities/wallet.entity';
import { ModernWalletCardDto } from '../../presentation/dto/modern-wallet-card.dto';

@Injectable()
export class GetWalletOverviewUseCase {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(userId: string): Promise<ModernWalletCardDto> {
    // Get or create user's wallet
    let wallet = await this.walletRepository.findByUserId(userId);
    
    if (!wallet) {
      wallet = Wallet.create(userId);
      await this.walletRepository.create(wallet);
    }

    // Return wallet overview
    return {
      availableBalance: wallet.balance,
      todayEarnings: wallet.todayEarnings,
      lastWithdrawnAmount: wallet.lastWithdrawnAmount || null,
      accountNumber: wallet.accountNumber || null,
      accountName: wallet.accountName || null,
      totalEarnings: wallet.totalEarnings,
      lastTransactionDate: wallet.lastTransactionDate?.toISOString() || null,
    };
  }
}
