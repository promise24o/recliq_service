import { Injectable, Inject } from '@nestjs/common';
import { WALLET_REPOSITORY_TOKEN } from '../../domain/repositories/wallet.repository.token';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import { Wallet } from '../../domain/entities/wallet.entity';

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findByUserId(userId);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = Wallet.create(userId);
      await this.walletRepository.create(wallet);
    }

    return wallet;
  }
}
