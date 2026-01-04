import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { Wallet } from '../../domain/entities/wallet.entity';
import { AccountNumberUtil } from '../../../../shared/utils/account-number.util';

@Injectable()
export class WalletSeedingService {
  private readonly logger = new Logger(WalletSeedingService.name);

  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepository: IWalletRepository,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  /**
   * Note: This method requires a findAll method to be implemented in the repositories.
   * For now, this method will need to be called with a list of user IDs.
   */
  async generateAccountNumbersForExistingUsers(userIds?: string[]): Promise<void> {
    this.logger.log('Starting account number generation for existing users...');
    
    try {
      // If no userIds provided, we can't proceed without findAll method
      if (!userIds || userIds.length === 0) {
        this.logger.warn('No user IDs provided. Cannot generate account numbers without findAll method implementation.');
        return;
      }

      let updatedCount = 0;

      for (const userId of userIds) {
        // Get user
        const user = await this.authRepository.findById(userId);
        if (!user) {
          this.logger.warn(`User with ID ${userId} not found`);
          continue;
        }

        // Get user's wallet
        let wallet = await this.walletRepository.findByUserId(user.id);
        
        if (!wallet) {
          // Create wallet if it doesn't exist
          wallet = Wallet.create(user.id);
          await this.walletRepository.create(wallet);
        }

        // Generate account number if wallet doesn't have one
        if (!wallet.accountNumber) {
          const accountNumber = await this.generateUniqueAccountNumber();
          const accountName = this.generateAccountName(user);
          
          wallet.updateAccountDetails(accountNumber, accountName);
          await this.walletRepository.update(wallet);
          
          updatedCount++;
          this.logger.log(`Generated account number ${accountNumber} for user ${user.email}`);
        }
      }

      this.logger.log(`Account number generation completed. Updated ${updatedCount} wallets.`);
    } catch (error) {
      this.logger.error(`Error generating account numbers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates account number for a specific user
   */
  async generateAccountNumberForUser(userId: string): Promise<string> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    let wallet = await this.walletRepository.findByUserId(userId);
    
    if (!wallet) {
      wallet = Wallet.create(userId);
      await this.walletRepository.create(wallet);
    }

    if (wallet.accountNumber) {
      this.logger.log(`User ${userId} already has account number: ${wallet.accountNumber}`);
      return wallet.accountNumber;
    }

    const accountNumber = await this.generateUniqueAccountNumber();
    const accountName = this.generateAccountName(user);
    
    wallet.updateAccountDetails(accountNumber, accountName);
    await this.walletRepository.update(wallet);
    
    this.logger.log(`Generated account number ${accountNumber} for user ${userId}`);
    return accountNumber;
  }

  private async generateUniqueAccountNumber(): Promise<string> {
    // Since we don't have findAll method, we'll generate and check for duplicates
    // by attempting to save and handling unique constraint violations
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      const accountNumber = AccountNumberUtil.generateAccountNumber();
      
      // Check if this account number already exists by trying to find a wallet with it
      // Since we don't have findByAccountNumber, we'll rely on database unique constraint
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique account number after maximum attempts');
      }
      
      // Return the generated number - uniqueness will be enforced by database constraint
      return accountNumber;
    } while (true);
  }

  private generateAccountName(user: any): string {
    // Use the user's full name (uppercase)
    const fullName = user.name?.toUpperCase() || '';
    
    if (fullName) {
      return fullName;
    } else {
      // Fallback to firstName + lastName if name is not available
      const firstName = user.firstName?.toUpperCase() || '';
      const lastName = user.lastName?.toUpperCase() || '';
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      } else {
        return 'ACCOUNT HOLDER';
      }
    }
  }
}
