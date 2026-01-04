import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IAuthRepository } from '../modules/auth/domain/repositories/auth.repository';
import { User } from '../modules/auth/domain/entities/user.entity';
import { Email } from '../modules/auth/domain/value-objects/email.vo';
import { UserRole } from '../shared/constants/roles';
import { AdminSubRole } from '../shared/constants/admin-sub-roles';
import { PasswordService } from '../modules/auth/infrastructure/security/password.service';

async function seedAdmin() {
  const adminEmail = 'admin@recliq.com';
  const adminPassword = 'admin123';
  
  console.log(`Seeding admin user with email: ${adminEmail}`);
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const authRepository = app.get('IAuthRepository');
    const passwordService = app.get(PasswordService);
    
    // Check if admin user already exists
    const existingAdmin = await authRepository.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Skipping creation.');
      return;
    }
    
    // Hash the admin password
    const hashedPassword = await passwordService.hashPassword(adminPassword);
    
    // Create admin user using constructor
    const adminUser = new User(
      '', // id will be set by DB
      'Admin User',
      Email.create(adminEmail),
      undefined, // phone
      UserRole.ADMIN,
      AdminSubRole.SUPER_ADMIN, // Super Admin has full access
      true, // isVerified
      hashedPassword,
      undefined, // pin
      false, // biometricEnabled
      undefined, // profilePhoto
      undefined, // referralCode
      {
        priceUpdates: false,
        loginEmails: true,
      }
    );
    
    // Save admin user
    await authRepository.save(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log(`   Sub-Role: SUPER_ADMIN (Full access)`);
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedAdmin();
