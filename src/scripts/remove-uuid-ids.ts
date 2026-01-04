import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccountDocument } from '../modules/wallet/infrastructure/persistence/bank-account.model';

async function removeUuidIds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const bankAccountModel = app.get<Model<BankAccountDocument>>(getModelToken('BankAccount'));
    
    // Find all bank accounts that have a custom id field
    const accountsWithUuid = await bankAccountModel.find({ id: { $exists: true } });
    
    console.log(`Found ${accountsWithUuid.length} bank accounts with UUID id field`);
    
    if (accountsWithUuid.length === 0) {
      console.log('No bank accounts have UUID id field');
      return;
    }
    
    // Remove the custom id field from all accounts
    for (const account of accountsWithUuid) {
      await bankAccountModel.updateOne(
        { _id: account._id },
        { $unset: { id: 1 } }
      );
      console.log(`Removed UUID id from account ${account._id}`);
    }
    
    console.log('UUID id removal completed successfully');
  } catch (error) {
    console.error('UUID id removal failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  removeUuidIds()
    .then(() => {
      console.log('UUID id removal completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('UUID id removal failed:', error);
      process.exit(1);
    });
}

export { removeUuidIds };
