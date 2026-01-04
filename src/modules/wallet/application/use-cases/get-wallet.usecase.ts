import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import { Wallet } from '../../domain/entities/wallet.entity';

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject('IWalletRepository')
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
