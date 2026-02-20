import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function seedTransactions() {
  console.log('🌱 Starting transaction seeding for user 6956cd1d842c6afdc694d3fe...');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const transactionModel = app.get('TransactionModel');
    
    const userId = '6956cd1d842c6afdc694d3fe';
    
    // Clear existing transactions for this user
    await transactionModel.deleteMany({ userId });
    console.log(`🗑️  Cleared existing transactions for user: ${userId}`);

    const transactions: any[] = [];
    let runningBalance = 0;

    // 1. Welcome bonus (account creation)
    const welcomeBonus = {
      id: `TXN_${userId}_WELCOME`,
      userId,
      type: 'bonus',
      amount: 1000, // 1000 NGN welcome bonus
      description: 'Welcome bonus - Account creation',
      status: 'successful',
      reference: `WELCOME_${userId}`,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      updatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    };
    transactions.push(welcomeBonus);
    runningBalance += 1000;

    // 2. Recycling pickups (main source of income)
    console.log('♻️  Generating recycling pickup transactions...');
    for (let i = 0; i < 45; i++) {
      const amount = Math.floor(Math.random() * 400) + 100; // 100-500 NGN
      const date = new Date(Date.now() - (i * 4 * 24 * 60 * 60 * 1000)); // Every 4 days
      
      const pickupTransaction = {
        id: `TXN_${userId}_PICKUP_${i + 1}`,
        userId,
        type: 'earning',
        amount,
        description: `Recycling reward - Pickup #${1000 + i}`,
        status: 'successful',
        reference: `PICKUP_${1000 + i}`,
        createdAt: date,
        updatedAt: date,
      };
      transactions.push(pickupTransaction);
      runningBalance += amount;
    }

    // 3. Referral bonuses
    console.log('👥 Generating referral bonus transactions...');
    for (let i = 0; i < 3; i++) {
      const amount = Math.floor(Math.random() * 200) + 50; // 50-250 NGN
      const date = new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)); // Monthly
      
      const referralTransaction = {
        id: `TXN_${userId}_REFERRAL_${i + 1}`,
        userId,
        type: 'referral',
        amount,
        description: 'Referral bonus - User referred',
        status: 'successful',
        reference: `REF_${userId}_${i + 1}`,
        createdAt: date,
        updatedAt: date,
      };
      transactions.push(referralTransaction);
      runningBalance += amount;
    }

    // 4. Withdrawals
    console.log('💸 Generating withdrawal transactions...');
    for (let i = 0; i < 8; i++) {
      const amount = Math.floor(Math.random() * 2000) + 500; // 500-2500 NGN
      const date = new Date(Date.now() - (i * 15 * 24 * 60 * 60 * 1000)); // Every 15 days
      
      if (runningBalance >= amount) {
        const withdrawalTransaction = {
          id: `TXN_${userId}_WITHDRAW_${i + 1}`,
          userId,
          type: 'withdrawal',
          amount,
          description: 'Withdrawal to bank account',
          status: 'successful',
          reference: `WITHDRAW_${userId}_${i + 1}`,
          createdAt: date,
          updatedAt: date,
        };
        transactions.push(withdrawalTransaction);
        runningBalance -= amount;
      }
    }

    // 5. Escrow transactions (dispute scenarios)
    console.log('⚖️  Generating escrow transactions...');
    for (let i = 0; i < 5; i++) {
      const amount = Math.floor(Math.random() * 300) + 50; // 50-350 NGN
      const holdDate = new Date(Date.now() - (i * 20 * 24 * 60 * 60 * 1000));
      
      // Hold in escrow (as penalty)
      const escrowHoldTransaction = {
        id: `TXN_${userId}_ESCROW_HOLD_${i + 1}`,
        userId,
        type: 'penalty',
        amount,
        description: `Amount held in escrow - Dispute #${2000 + i}`,
        status: 'successful',
        reference: `ESCROW_HOLD_${i + 1}`,
        createdAt: holdDate,
        updatedAt: holdDate,
      };
      transactions.push(escrowHoldTransaction);
      runningBalance -= amount;

      // Release from escrow (after 7 days)
      const releaseDate = new Date(holdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const escrowReleaseTransaction = {
        id: `TXN_${userId}_ESCROW_RELEASE_${i + 1}`,
        userId,
        type: 'refund',
        amount,
        description: `Escrow released - Dispute #${2000 + i} resolved`,
        status: 'successful',
        reference: `ESCROW_RELEASE_${i + 1}`,
        createdAt: releaseDate,
        updatedAt: releaseDate,
      };
      transactions.push(escrowReleaseTransaction);
      runningBalance += amount;
    }

    // 6. Penalties/fees
    console.log('⚠️  Generating penalty transactions...');
    for (let i = 0; i < 2; i++) {
      const amount = Math.floor(Math.random() * 100) + 20; // 20-120 NGN
      const date = new Date(Date.now() - (i * 45 * 24 * 60 * 60 * 1000));
      
      const penaltyTransaction = {
        id: `TXN_${userId}_PENALTY_${i + 1}`,
        userId,
        type: 'penalty',
        amount,
        description: 'Service fee - Late pickup cancellation',
        status: 'successful',
        reference: `PENALTY_${i + 1}`,
        createdAt: date,
        updatedAt: date,
      };
      transactions.push(penaltyTransaction);
      runningBalance -= amount;
    }

    // 7. Additional bonuses and adjustments
    console.log('🎖️  Generating loyalty bonus transactions...');
    for (let i = 0; i < 4; i++) {
      const amount = Math.floor(Math.random() * 150) + 25; // 25-175 NGN
      const date = new Date(Date.now() - (i * 25 * 24 * 60 * 60 * 1000));
      
      const bonusTransaction = {
        id: `TXN_${userId}_BONUS_${i + 1}`,
        userId,
        type: 'bonus',
        amount,
        description: 'Loyalty bonus - Active user reward',
        status: 'successful',
        reference: `BONUS_${i + 1}`,
        createdAt: date,
        updatedAt: date,
      };
      transactions.push(bonusTransaction);
      runningBalance += amount;
    }

    // Sort transactions by date (oldest first for proper insertion)
    transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Insert all transactions
    console.log('💾 Inserting transactions into database...');
    for (const transaction of transactions) {
      const doc = new transactionModel(transaction);
      await doc.save();
    }

    console.log(`✅ Generated ${transactions.length} transactions for user ${userId}`);
    console.log(`💰 Final running balance: ${runningBalance} NGN`);
    console.log(`📊 Transaction breakdown:`);
    console.log(`   - Welcome bonus: 1 transaction (1,000 NGN)`);
    console.log(`   - Recycling rewards: 45 transactions`);
    console.log(`   - Referral bonuses: 3 transactions`);
    console.log(`   - Withdrawals: 8 transactions`);
    console.log(`   - Escrow activities: 10 transactions`);
    console.log(`   - Penalties: 2 transactions`);
    console.log(`   - Loyalty bonuses: 4 transactions`);
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
