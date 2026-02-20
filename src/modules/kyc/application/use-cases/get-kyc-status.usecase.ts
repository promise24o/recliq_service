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
    let kyc = await this.kycRepository.findByUserId(userId);
    
    // Get user's actual email verification status
    let userEmailVerified = false;
    try {
      const userDetail = await this.getUserDetailUseCase.execute(userId);
      userEmailVerified = userDetail.isVerified;
    } catch (error) {
      console.warn('Could not verify user email status:', error.message);
    }
    
    // If KYC doesn't exist, create a default one
    if (!kyc) {
      kyc = await this.createDefaultKyc(userId, KycUserType.INDIVIDUAL, userEmailVerified);
    } else if (kyc.emailVerified !== userEmailVerified) {
      // Update KYC email verification status if it differs from user status
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
      bvnVerified: !!kyc.bvnData,
      documentsUploaded: kyc.documents.length > 0,
      selfieUploaded: !!kyc.selfie,
      businessDocumentsUploaded: (kyc.businessDocuments?.length || 0) > 0,
      businessDetails: kyc.businessDetails, // Include business details in response
      limits: kyc.limits,
      availableTiers,
      nextTierRequirements,
      rejectionReason: kyc.rejectionReason,
    };
  }

  private async createDefaultKyc(userId: string, userType: KycUserType, emailVerified: boolean): Promise<Kyc> {
    const defaultKyc = {
      id: '', // Will be set by repository
      userId,
      userType,
      currentTier: KycTier.SPROUT,
      status: KycStatus.PENDING,
      emailVerified, // Use actual email verification status
      documents: [],
      businessDocuments: [],
      limits: {
        dailyWithdrawal: 1000000,  // ₦1M daily withdrawal
        maxWalletBalance: 5000000,  // ₦5M max wallet balance
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.kycRepository.create(defaultKyc);
  }

  private getAvailableTiers(userType: KycUserType): string[] {
    switch (userType) {
      case KycUserType.INDIVIDUAL:
        return [KycTier.SPROUT, KycTier.BLOOM];
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
