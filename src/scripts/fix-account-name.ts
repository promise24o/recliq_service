import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IWalletRepository } from '../modules/wallet/domain/repositories/wallet.repository';
import { Wallet } from '../modules/wallet/domain/entities/wallet.entity';

async function fixAccountName() {
  const userId = '6956cd1d842c6afdc694d3fe';
  const correctAccountName = 'JOHN DANIELSS';
  
  console.log(`Fixing account name for user: ${userId}`);
  console.log(`Setting account name to: ${correctAccountName}`);
  
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
    
    console.log('Current account name:', wallet.accountName);
    
    // Update the account name
    wallet.updateAccountDetails(wallet.accountNumber || '841220214778', correctAccountName);
    await walletRepository.update(wallet);
    
    console.log(`✅ Account name updated successfully to: ${correctAccountName}`);
  } catch (error) {
    console.error('❌ Failed to update account name:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

fixAccountName();
