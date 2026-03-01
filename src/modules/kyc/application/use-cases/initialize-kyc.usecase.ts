import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { KycUserType, KycTier, KycStatus } from '../../domain/types/kyc.types';
import { KycEntity } from '../../domain/entities/kyc.entity';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { GetUserDetailUseCase } from '../../../users/application/use-cases/get-user-detail.usecase';

export interface KycInitializeResult {
  success: boolean;
  message: string;
  userId: string;
  userType: KycUserType;
  currentTier: string;
  status: string;
  requirements: string[];
  limits: {
    dailyWithdrawal: number;
    maxWalletBalance: number;
  };
}

@Injectable()
export class InitializeKycUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
    private getUserDetailUseCase: GetUserDetailUseCase,
  ) {}

  async execute(userId: string, userType: KycUserType): Promise<KycInitializeResult> {
    console.log(`Initializing KYC for user ${userId} with type ${userType}`);
    
    // Check if KYC already exists
    const existingKyc = await this.kycRepository.findByUserId(userId);
    
    if (existingKyc) {
      console.log(`Existing KYC found for user ${userId} with type ${existingKyc.userType}`);
      
      // If KYC exists but with different user type, update it
      if (existingKyc.userType !== userType) {
        console.log(`Updating KYC user type from ${existingKyc.userType} to ${userType}`);
        // Get user's email verification status
        let emailVerified = false;
        try {
          const userDetail = await this.getUserDetailUseCase.execute(userId);
          emailVerified = userDetail.isVerified;
        } catch (error) {
          console.warn('Could not verify user email status:', error.message);
        }

        // Update the existing KYC with new user type and email verification status
        existingKyc.userType = userType;
        existingKyc.emailVerified = emailVerified;
        existingKyc.updatedAt = new Date();
        
        // Reset tier and status when switching user types to ensure proper verification flow
        existingKyc.currentTier = KycTier.SPROUT;
        existingKyc.status = KycStatus.PENDING;
        
        // Clear all verification data when switching user types to ensure clean slate
        existingKyc.bvnData = undefined;
        existingKyc.documents = [];
        existingKyc.businessDocuments = [];
        existingKyc.selfie = undefined;
        existingKyc.businessDetails = undefined;
        existingKyc.rejectionReason = undefined;
        
        const updatedKyc = await this.kycRepository.update(existingKyc);
        
        const requirements = this.getRequirementsForUserType(userType);
        
        return {
          success: true,
          message: 'KYC user type updated successfully',
          userId: updatedKyc.userId,
          userType: updatedKyc.userType,
          currentTier: updatedKyc.currentTier,
          status: updatedKyc.status,
          requirements,
          limits: updatedKyc.limits,
        };
      } else {
        // KYC already exists with same user type
        console.log(`KYC already exists for user ${userId} with same type ${userType}`);
        throw new BadRequestException('KYC already initialized for this user with the same type');
      }
    }

    console.log(`Creating new KYC for user ${userId} with type ${userType}`);

    // Get user details to check email verification status
    let emailVerified = false;
    try {
      const userDetail = await this.getUserDetailUseCase.execute(userId);
      emailVerified = userDetail.isVerified; // User's isVerified represents email/OTP verification status
    } catch (error) {
      // If user not found, keep emailVerified as false
      console.warn('Could not verify user email status:', error.message);
    }

    
    // Create new KYC entity with clean slate
    const kycEntity = new KycEntity(
      '', // Will be set by repository
      userId,
      userType,
      KycTier.SPROUT,
      KycStatus.PENDING,
      emailVerified, // Use actual email verification status from user
      [], // Empty documents array
      {
        dailyWithdrawal: 1000000,  // ₦1M daily withdrawal
        maxWalletBalance: 5000000,  // ₦5M max wallet balance
      },
      new Date(),
      new Date(),
      undefined, // No BVN data
      [], // Empty business documents
      undefined, // No selfie
      undefined, // No business details
      undefined, // No rejection reason
    );

    // Save KYC record
    console.log(`Creating new KYC entity:`, JSON.stringify(kycEntity, null, 2));
    const savedKyc = await this.kycRepository.create(kycEntity);
    console.log(`Saved KYC entity:`, JSON.stringify(savedKyc, null, 2));

    // Get requirements based on user type
    const requirements = this.getRequirementsForUserType(userType);

    return {
      success: true,
      message: 'KYC initialized successfully',
      userId: savedKyc.userId,
      userType: savedKyc.userType,
      currentTier: savedKyc.currentTier,
      status: savedKyc.status,
      requirements,
      limits: savedKyc.limits,
    };
  }

  private getRequirementsForUserType(userType: KycUserType): string[] {
    switch (userType) {
      case KycUserType.INDIVIDUAL:
        return ['BVN verification required'];
      
      case KycUserType.ENTERPRISE:
        return [
          'Business registration document required',
          'Utility bill required for address verification'
        ];
      
      case KycUserType.AGENT:
        return [
          'BVN verification required',
          'Passport or ID card required',
          'Selfie photo required'
        ];
      
      default:
        return [];
    }
  }
}
