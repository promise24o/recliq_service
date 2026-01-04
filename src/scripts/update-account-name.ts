import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WalletSeedingService } from '../modules/wallet/infrastructure/services/wallet-seeding.service';
import { IAuthRepository } from '../modules/auth/domain/repositories/auth.repository';

async function updateAccountName() {
  const userId = '6956cd1d842c6afdc694d3fe';
  
  console.log(`Updating account name for user: ${userId}`);
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const authRepository = app.get('IAuthRepository');
    const walletSeedingService = app.get(WalletSeedingService);
    
    // Get the user to see their actual name
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- First Name:', user.firstName);
    console.log('- Last Name:', user.lastName);
    
    // Regenerate account number with correct name
    const accountNumber = await walletSeedingService.generateAccountNumberForUser(userId);
    console.log(`✅ Account updated successfully: ${accountNumber}`);
  } catch (error) {
    console.error('❌ Failed to update account name:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

updateAccountName();
