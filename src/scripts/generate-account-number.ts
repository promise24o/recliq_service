import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WalletSeedingService } from '../modules/wallet/infrastructure/services/wallet-seeding.service';

async function generateAccountNumber() {
  const userId = '6956cd1d842c6afdc694d3fe';
  
  console.log(`Generating account details for user: ${userId}`);
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const walletSeedingService = app.get(WalletSeedingService);
    const accountNumber = await walletSeedingService.generateAccountNumberForUser(userId);
    console.log(`✅ Account number generated successfully: ${accountNumber}`);
  } catch (error) {
    console.error('❌ Failed to generate account number:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

generateAccountNumber();
