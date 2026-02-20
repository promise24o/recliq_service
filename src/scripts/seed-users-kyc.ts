import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IAuthRepository } from '../modules/auth/domain/repositories/auth.repository';
import type { IKycRepository } from '../modules/kyc/domain/repositories/kyc.repository';
import { User } from '../modules/auth/domain/entities/user.entity';
import { Email } from '../modules/auth/domain/value-objects/email.vo';
import { Phone } from '../modules/auth/domain/value-objects/phone.vo';
import { UserRole } from '../shared/constants/roles';
import { PasswordService } from '../modules/auth/infrastructure/security/password.service';
import { KycUserType, KycTier, KycStatus, BusinessNature } from '../modules/kyc/domain/types/kyc.types';

interface UserData {
  name: string;
  email: string;
  phone: string;
  userType: KycUserType;
  isVerified: boolean;
  kycStatus: KycStatus;
  kycTier: KycTier;
  hasBvn: boolean;
  hasDocuments: boolean;
  hasSelfie: boolean;
  businessDetails?: any;
}

async function seedUsersAndKyc() {
  console.log('🌱 Starting seed for 20 users with KYC data...');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  
  try {
    const authRepository = app.get('IAuthRepository');
    const kycRepository = app.get('IKycRepository');
    const passwordService = app.get(PasswordService);
    
    // Generate user data
    const usersData: UserData[] = [
      // 10 INDIVIDUAL USERS
      { name: 'John Doe', email: 'john.doe@example.com', phone: '+2348012345678', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.THRIVE, hasBvn: true, hasDocuments: true, hasSelfie: true },
      { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+2348023456789', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: false, hasSelfie: true },
      { name: 'Mike Johnson', email: 'mike.johnson@example.com', phone: '+2348034567890', userType: KycUserType.INDIVIDUAL, isVerified: false, kycStatus: KycStatus.PENDING, kycTier: KycTier.SPROUT, hasBvn: false, hasDocuments: false, hasSelfie: false },
      { name: 'Sarah Williams', email: 'sarah.williams@example.com', phone: '+2348045678901', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.IN_PROGRESS, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: true, hasSelfie: false },
      { name: 'David Brown', email: 'david.brown@example.com', phone: '+2348056789012', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: false, hasSelfie: true },
      { name: 'Emily Davis', email: 'emily.davis@example.com', phone: '+2348067890123', userType: KycUserType.INDIVIDUAL, isVerified: false, kycStatus: KycStatus.PENDING, kycTier: KycTier.SPROUT, hasBvn: false, hasDocuments: false, hasSelfie: false },
      { name: 'Robert Wilson', email: 'robert.wilson@example.com', phone: '+2348078901234', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.REJECTED, kycTier: KycTier.SPROUT, hasBvn: false, hasDocuments: true, hasSelfie: true },
      { name: 'Lisa Anderson', email: 'lisa.anderson@example.com', phone: '+2348089012345', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.IN_PROGRESS, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: false, hasSelfie: true },
      { name: 'James Taylor', email: 'james.taylor@example.com', phone: '+2348090123456', userType: KycUserType.INDIVIDUAL, isVerified: false, kycStatus: KycStatus.PENDING, kycTier: KycTier.SPROUT, hasBvn: false, hasDocuments: false, hasSelfie: false },
      { name: 'Patricia Martinez', email: 'patricia.martinez@example.com', phone: '+2348101234567', userType: KycUserType.INDIVIDUAL, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.THRIVE, hasBvn: true, hasDocuments: true, hasSelfie: true },
      
      // 5 ENTERPRISE USERS
      { 
        name: 'Tech Solutions Ltd', 
        email: 'contact@techsolutions.com', 
        phone: '+2348112345678', 
        userType: KycUserType.ENTERPRISE, 
        isVerified: true, 
        kycStatus: KycStatus.VERIFIED, 
        kycTier: KycTier.THRIVE, 
        hasBvn: true, 
        hasDocuments: true, 
        hasSelfie: true,
        businessDetails: {
          businessName: 'Tech Solutions Ltd',
          businessAddress: '123 Tech Avenue, Victoria Island, Lagos, Nigeria',
          natureOfBusiness: BusinessNature.OFFICE,
          businessDescription: 'Software development and IT consulting services',
          businessEmail: 'contact@techsolutions.com',
          businessPhone: '+2348112345678',
          registrationNumber: 'RC123456',
          taxIdentificationNumber: 'TIN789012',
          businessLocation: {
            latitude: 6.5764,
            longitude: 3.3792,
            address: '123 Tech Avenue, Victoria Island, Lagos, Nigeria'
          }
        }
      },
      { 
        name: 'Global Trading Co', 
        email: 'info@globaltrading.com', 
        phone: '+2348123456789', 
        userType: KycUserType.ENTERPRISE, 
        isVerified: true, 
        kycStatus: KycStatus.IN_PROGRESS, 
        kycTier: KycTier.BLOOM, 
        hasBvn: true, 
        hasDocuments: true, 
        hasSelfie: false,
        businessDetails: {
          businessName: 'Global Trading Co',
          businessAddress: '456 Market Street, Ikeja, Lagos, Nigeria',
          natureOfBusiness: BusinessNature.RETAIL,
          businessDescription: 'Import and export of consumer goods',
          businessEmail: 'info@globaltrading.com',
          businessPhone: '+2348123456789',
          registrationNumber: 'RC234567',
          taxIdentificationNumber: 'TIN890123',
          businessLocation: {
            latitude: 6.6018,
            longitude: 3.3515,
            address: '456 Market Street, Ikeja, Lagos, Nigeria'
          }
        }
      },
      { 
        name: 'Manufacturing Plus', 
        email: 'admin@manufacturingplus.com', 
        phone: '+2348134567890', 
        userType: KycUserType.ENTERPRISE, 
        isVerified: false, 
        kycStatus: KycStatus.PENDING, 
        kycTier: KycTier.SPROUT, 
        hasBvn: false, 
        hasDocuments: false, 
        hasSelfie: false,
        businessDetails: {
          businessName: 'Manufacturing Plus',
          businessAddress: '789 Industrial Road, Apapa, Lagos, Nigeria',
          natureOfBusiness: BusinessNature.MANUFACTURING,
          businessDescription: 'Manufacturing of industrial equipment',
          businessEmail: 'admin@manufacturingplus.com',
          businessPhone: '+2348134567890',
          registrationNumber: 'RC345678',
          taxIdentificationNumber: 'TIN901234',
          businessLocation: {
            latitude: 6.6494,
            longitude: 3.3421,
            address: '789 Industrial Road, Apapa, Lagos, Nigeria'
          }
        }
      },
      { 
        name: 'Healthcare Services Ltd', 
        email: 'contact@healthcareservices.com', 
        phone: '+2348145678901', 
        userType: KycUserType.ENTERPRISE, 
        isVerified: true, 
        kycStatus: KycStatus.VERIFIED, 
        kycTier: KycTier.THRIVE, 
        hasBvn: true, 
        hasDocuments: true, 
        hasSelfie: true,
        businessDetails: {
          businessName: 'Healthcare Services Ltd',
          businessAddress: '321 Medical Boulevard, Lekki, Lagos, Nigeria',
          natureOfBusiness: BusinessNature.HEALTHCARE,
          businessDescription: 'Private healthcare and medical services',
          businessEmail: 'contact@healthcareservices.com',
          businessPhone: '+2348145678901',
          registrationNumber: 'RC456789',
          taxIdentificationNumber: 'TIN012345',
          businessLocation: {
            latitude: 6.4641,
            longitude: 3.5549,
            address: '321 Medical Boulevard, Lekki, Lagos, Nigeria'
          }
        }
      },
      { 
        name: 'Education First Academy', 
        email: 'info@educationfirst.com', 
        phone: '+2348156789012', 
        userType: KycUserType.ENTERPRISE, 
        isVerified: true, 
        kycStatus: KycStatus.REJECTED, 
        kycTier: KycTier.SPROUT, 
        hasBvn: false, 
        hasDocuments: true, 
        hasSelfie: true,
        businessDetails: {
          businessName: 'Education First Academy',
          businessAddress: '654 School Lane, Ikoyi, Lagos, Nigeria',
          natureOfBusiness: BusinessNature.SCHOOL,
          businessDescription: 'Private educational institution',
          businessEmail: 'info@educationfirst.com',
          businessPhone: '+2348156789012',
          registrationNumber: 'RC567890',
          taxIdentificationNumber: 'TIN123456',
          businessLocation: {
            latitude: 6.4613,
            longitude: 3.4179,
            address: '654 School Lane, Ikoyi, Lagos, Nigeria'
          }
        }
      },
      
      // 5 AGENT USERS
      { name: 'Agent One', email: 'agent.one@recliq.com', phone: '+2348167890123', userType: KycUserType.AGENT, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.THRIVE, hasBvn: true, hasDocuments: true, hasSelfie: true },
      { name: 'Agent Two', email: 'agent.two@recliq.com', phone: '+2348178901234', userType: KycUserType.AGENT, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: false, hasSelfie: true },
      { name: 'Agent Three', email: 'agent.three@recliq.com', phone: '+2348189012345', userType: KycUserType.AGENT, isVerified: false, kycStatus: KycStatus.PENDING, kycTier: KycTier.SPROUT, hasBvn: false, hasDocuments: false, hasSelfie: false },
      { name: 'Agent Four', email: 'agent.four@recliq.com', phone: '+2348190123456', userType: KycUserType.AGENT, isVerified: true, kycStatus: KycStatus.IN_PROGRESS, kycTier: KycTier.BLOOM, hasBvn: true, hasDocuments: true, hasSelfie: false },
      { name: 'Agent Five', email: 'agent.five@recliq.com', phone: '+2348201234567', userType: KycUserType.AGENT, isVerified: true, kycStatus: KycStatus.VERIFIED, kycTier: KycTier.THRIVE, hasBvn: true, hasDocuments: true, hasSelfie: true },
    ];
    
    const hashedPassword = await passwordService.hashPassword('password26');
    const hashedPin = await passwordService.hashPassword('1234');
    
    console.log(`📝 Creating ${usersData.length} users...`);
    
    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await authRepository.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }
        
        // Create user
        const referralCode = generateReferralCode();
        
        const user = new User(
          '', // id will be set by database
          userData.name,
          Email.create(userData.email), // Email value object
          Phone.create(userData.phone), // Phone value object
          UserRole.USER,
          undefined, // adminSubRole
          userData.isVerified,
          hashedPassword,
          hashedPin,
          false, // biometricEnabled
          undefined, // profilePhoto
          referralCode,
          {
            priceUpdates: true,
            loginEmails: false,
            loginAlerts: { email: true, inApp: true },
            passwordChanges: { email: true, inApp: true },
            failedLoginAttempts: { email: true, inApp: true },
            pickupEscalations: { email: true, inApp: true },
            agentStatusChanges: { email: false, inApp: true },
            paymentApprovals: { email: true, inApp: true },
            floatAlerts: { email: true, inApp: true },
            systemUpdates: { email: false, inApp: true },
          },
          {
            type: 'Point',
            coordinates: [3.3792, 6.5764], // Default Lagos coordinates
            address: 'Lagos, Nigeria',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
          },
          undefined, // otp
          undefined, // otpExpiresAt
          new Date(),
          new Date()
        );
        
        const savedUser = await authRepository.save(user);
        const userId = savedUser.id; // Get the ID from the saved user
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
        
        // Create KYC data
        await createKycData(kycRepository, userId, userData);
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }
    
    console.log('🎉 Successfully seeded users and KYC data!');
    
  } catch (error) {
    console.error('❌ Failed to seed users and KYC:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function createKycData(kycRepository: IKycRepository, userId: string, userData: UserData) {
  try {
    // Check if KYC already exists
    const existingKyc = await kycRepository.findByUserId(userId);
    if (existingKyc) {
      console.log(`⚠️  KYC already exists for user ${userId}, skipping...`);
      return;
    }
    
    // Create KYC record
    const kycData: any = {
      id: uuidv4(),
      userId,
      userType: userData.userType,
      currentTier: userData.kycTier,
      status: userData.kycStatus,
      emailVerified: userData.isVerified,
      documents: [],
      businessDocuments: [],
      limits: {
        dailyWithdrawal: 1000000,
        maxWalletBalance: 5000000,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add BVN data if applicable
    if (userData.hasBvn) {
      kycData.bvnData = {
        bvn: '12345678901',
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ')[1] || 'User',
        dateOfBirth: '1990-01-01',
        phoneNumber: userData.phone.replace('+234', '0'),
        verifiedAt: new Date(),
      };
    }
    
    // Add documents if applicable
    if (userData.hasDocuments) {
      kycData.documents = [
        {
          documentType: 'id_card',
          documentUrl: `https://example.com/docs/${userId}/id_card.jpg`,
          uploadedAt: new Date(),
          verified: userData.kycStatus === KycStatus.VERIFIED,
          verifiedAt: userData.kycStatus === KycStatus.VERIFIED ? new Date() : undefined,
        }
      ];
      
      // Add business documents for enterprise users
      if (userData.userType === KycUserType.ENTERPRISE) {
        kycData.businessDocuments = [
          {
            documentType: 'business_registration',
            documentUrl: `https://example.com/docs/${userId}/business_registration.pdf`,
            uploadedAt: new Date(),
            verified: userData.kycStatus === KycStatus.VERIFIED,
            verifiedAt: userData.kycStatus === KycStatus.VERIFIED ? new Date() : undefined,
          },
          {
            documentType: 'tax_clearance',
            documentUrl: `https://example.com/docs/${userId}/tax_clearance.pdf`,
            uploadedAt: new Date(),
            verified: userData.kycStatus === KycStatus.VERIFIED,
            verifiedAt: userData.kycStatus === KycStatus.VERIFIED ? new Date() : undefined,
          }
        ];
      }
    }
    
    // Add selfie if applicable
    if (userData.hasSelfie) {
      kycData.selfie = {
        selfieUrl: `https://example.com/docs/${userId}/selfie.jpg`,
        uploadedAt: new Date(),
        verified: userData.kycStatus === KycStatus.VERIFIED,
        verifiedAt: userData.kycStatus === KycStatus.VERIFIED ? new Date() : undefined,
      };
    }
    
    // Add business details for enterprise users
    if (userData.businessDetails) {
      kycData.businessDetails = userData.businessDetails;
    }
    
    // Add rejection reason if rejected
    if (userData.kycStatus === KycStatus.REJECTED) {
      kycData.rejectionReason = 'Document quality is poor or information could not be verified';
    }
    
    await kycRepository.create(kycData);
    console.log(`✅ Created KYC for user: ${userData.name} (${userData.userType})`);
    
  } catch (error) {
    console.error(`❌ Failed to create KYC for user ${userId}:`, error.message);
  }
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

seedUsersAndKyc();
