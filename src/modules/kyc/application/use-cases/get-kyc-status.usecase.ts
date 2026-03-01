import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { Kyc, KycUserType, KycTier, KycStatus } from '../../domain/types/kyc.types';
import { GetUserDetailUseCase } from '../../../users/application/use-cases/get-user-detail.usecase';

export interface KycStatusResponse {
  userId: string;
  userType: KycUserType;
  currentTier: string;
  status: string;
  emailVerified: boolean;
  bvnVerified: boolean;
  documentsUploaded: boolean;
  selfieUploaded: boolean;
  businessDocumentsUploaded: boolean;
  businessDetails?: any; // Business details for enterprise users
  limits: {
    dailyWithdrawal: number;
    maxWalletBalance: number;
  };
  availableTiers: string[];
  nextTierRequirements: string[];
  rejectionReason?: string;
}

@Injectable()
export class GetKycStatusUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
    private getUserDetailUseCase: GetUserDetailUseCase,
  ) {}

  async execute(userId: string): Promise<KycStatusResponse> {
    const kyc = await this.kycRepository.findByUserId(userId);
    
    // If KYC doesn't exist, return a response indicating no KYC record
    if (!kyc) {
      return {
        userId,
        userType: KycUserType.INDIVIDUAL, // Default type
        currentTier: KycTier.SPROUT,
        status: KycStatus.PENDING,
        emailVerified: false,
        bvnVerified: false,
        documentsUploaded: false,
        selfieUploaded: false,
        businessDocumentsUploaded: false,
        businessDetails: null,
        limits: {
          dailyWithdrawal: 0, // No limits until KYC is initialized
          maxWalletBalance: 0,
        },
        availableTiers: [KycTier.SPROUT],
        nextTierRequirements: ['KYC initialization required'],
      };
    }
    
    // Get user's actual email verification status
    let userEmailVerified = false;
    try {
      const userDetail = await this.getUserDetailUseCase.execute(userId);
      userEmailVerified = userDetail.isVerified;
    } catch (error) {
      console.warn('Could not verify user email status:', error.message);
    }
    
    // Update KYC email verification status if it differs from user status
    if (kyc.emailVerified !== userEmailVerified) {
      kyc.emailVerified = userEmailVerified;
      kyc.updatedAt = new Date();
      await this.kycRepository.update(kyc);
    }

    const availableTiers = this.getAvailableTiers(kyc.userType);
    const nextTierRequirements = this.getNextTierRequirements(kyc);

    return {
      userId: kyc.userId,
      userType: kyc.userType,
      currentTier: kyc.currentTier,
      status: kyc.status,
      emailVerified: kyc.emailVerified, // Now reflects actual user verification status
      bvnVerified: !!kyc.bvnData && !!kyc.bvnData.bvn, // Check if BVN data has actual bvn value
      documentsUploaded: kyc.documents.length > 0,
      selfieUploaded: !!kyc.selfie && !!kyc.selfie.selfieUrl, // Check if selfie has actual selfieUrl
      businessDocumentsUploaded: (kyc.businessDocuments?.length || 0) > 0,
      businessDetails: (kyc.businessDetails && kyc.businessDetails.businessName) ? kyc.businessDetails : null, // Only return if has actual business data
      limits: kyc.limits,
      availableTiers,
      nextTierRequirements,
      rejectionReason: kyc.rejectionReason,
    };
  }

  
  private getAvailableTiers(userType: KycUserType): string[] {
    switch (userType) {
      case KycUserType.INDIVIDUAL:
        return [KycTier.SPROUT, KycTier.BLOOM, KycTier.THRIVE];
      case KycUserType.ENTERPRISE:
        return [KycTier.SPROUT];
      case KycUserType.AGENT:
        return [KycTier.SPROUT, KycTier.BLOOM, KycTier.THRIVE];
      default:
        return [KycTier.SPROUT];
    }
  }

  private getNextTierRequirements(kyc: Kyc): string[] {
    const requirements: string[] = [];

    if (!kyc.emailVerified) {
      requirements.push('Email verification required');
    }

    if (kyc.userType !== KycUserType.ENTERPRISE && !kyc.bvnData) {
      requirements.push('BVN verification required');
    } else if (kyc.userType === KycUserType.AGENT && kyc.bvnData) {
      // For agents, if BVN is already verified, don't require it again
      // This allows seamless switching from individual to agent
    }

    if (kyc.userType === KycUserType.AGENT) {
      if (kyc.documents.length === 0) {
        requirements.push('ID document upload required');
      }
      if (!kyc.selfie) {
        requirements.push('Selfie upload required');
      }
    }

    if (kyc.userType === KycUserType.ENTERPRISE) {
      if (!kyc.businessDocuments || kyc.businessDocuments.length === 0) {
        requirements.push('Business registration documents required');
      }
    }

    return requirements;
  }
}
