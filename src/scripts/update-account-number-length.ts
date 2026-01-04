import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IWalletRepository } from '../modules/wallet/domain/repositories/wallet.repository';
import { Wallet } from '../modules/wallet/domain/entities/wallet.entity';
import { AccountNumberUtil } from '../shared/utils/account-number.util';

async function updateAccountNumberLength() {
  const userId = '6956cd1d842c6afdc694d3fe';
  
  console.log(`Updating account number to 10 digits for user: ${userId}`);
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const walletRepository = app.get('IWalletRepository');
    
    // Get the user's wallet
    let wallet = await walletRepository.findByUserId(userId);
    
    if (!wallet) {
      throw new Error('Wallet not found for user');
    }
    
    console.log('Current account number:', wallet.accountNumber);
    
    // Generate a new 10-digit account number
    const newAccountNumber = AccountNumberUtil.generateAccountNumber();
    
    // Update the account number (keep the same account name)
    wallet.updateAccountDetails(newAccountNumber, wallet.accountName || 'JOHN DANIELSS');
    await walletRepository.update(wallet);
    
    console.log(`✅ Account number updated successfully!`);
    console.log(`   Old: ${wallet.accountNumber}`);
    console.log(`   New: ${newAccountNumber}`);
    console.log(`   Account Name: ${wallet.accountName}`);
  } catch (error) {
    console.error('❌ Failed to update account number:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

updateAccountNumberLength();
