import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

async function seedTransactions() {
  console.log('🌱 Starting transaction seeding for user 6956cd1d842c6afdc694d3fe...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const transactionSeeder = app.get('TransactionSeederService');
  
  const userId = '6956cd1d842c6afdc694d3fe';
  
  try {
    await transactionSeeder.generateTransactionsForUser(userId);
    console.log('✅ Transaction seeding completed successfully!');
    console.log(`📊 Generated transactions for user: ${userId}`);
    console.log('🎯 You can now test the user ledger API:');
    console.log(`   GET /finance/users/${userId}/ledger`);
    console.log(`   GET /finance/users/${userId}/ledger/summary`);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
  } finally {
    await app.close();
  }
}

// Run the seeding
seedTransactions();
