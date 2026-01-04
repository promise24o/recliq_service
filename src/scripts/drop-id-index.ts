import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccountDocument } from '../modules/wallet/infrastructure/persistence/bank-account.model';

async function dropIdIndex() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const bankAccountModel = app.get<Model<BankAccountDocument>>(getModelToken('BankAccount'));
    
    // Drop the unique index on the id field
    try {
      await bankAccountModel.collection.dropIndex('id_1');
      console.log('Successfully dropped id_1 index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('id_1 index does not exist, continuing...');
      } else {
        throw error;
      }
    }
    
    // List all indexes to verify
    const indexes = await bankAccountModel.collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    console.log('Index drop completed successfully');
  } catch (error) {
    console.error('Index drop failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  dropIdIndex()
    .then(() => {
      console.log('Index drop completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index drop failed:', error);
      process.exit(1);
    });
}

export { dropIdIndex };
