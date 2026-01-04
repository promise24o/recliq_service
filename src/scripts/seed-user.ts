import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserSeedingService } from '../modules/rewards/infrastructure/services/user-seeding.service';

async function seedUser() {
  const userId = '6956cd1d842c6afdc694d3fe';
  
  console.log(`Starting seed for user: ${userId}`);
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const userSeedingService = app.get(UserSeedingService);
    await userSeedingService.seedUserData(userId);
    console.log('✅ User data seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed user data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedUser();
