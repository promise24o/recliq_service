import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { KycUserType, KycTier, KycStatus } from '../../domain/types/kyc.types';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';
import { GetUserDetailUseCase } from '../../../users/application/use-cases/get-user-detail.usecase';

export interface AdminApprovalResult {
  success: boolean;
  message: string;
  userId: string;
  previousTier: string;
  newTier?: string;
  status: string;
}

@Injectable()
export class AdminApprovalUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
    private getUserDetailUseCase: GetUserDetailUseCase,
  ) {}

  async approveKyc(userId: string): Promise<AdminApprovalResult> {
    // Get KYC record
    const kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    // Only agents and enterprises can be approved for higher tiers
    if (kyc.userType !== 'agent' && (kyc.userType as string) !== 'ENTERPRISE') {
      throw new BadRequestException('Only AGENT and ENTERPRISE users can be approved for higher tiers');
    }

    // Check if all requirements are met
    const missingRequirements = this.getMissingRequirements(kyc);
    if (missingRequirements.length > 0) {
      throw new BadRequestException(`Cannot approve KYC - missing requirements: ${missingRequirements.join(', ')}`);
    }

    const previousTier = kyc.currentTier;
    let newTier: string;

    // Upgrade tier based on current tier
    if (kyc.currentTier === KycTier.SPROUT) {
      newTier = KycTier.BLOOM;
    } else if (kyc.currentTier === KycTier.BLOOM) {
      newTier = KycTier.THRIVE;
    } else {
      newTier = kyc.currentTier; // Already at highest tier
    }

    // Update KYC status and tier
    kyc.status = KycStatus.VERIFIED;
    kyc.currentTier = newTier as KycTier;
    kyc.rejectionReason = undefined;

    // Update limits based on new tier
    if (newTier === KycTier.BLOOM) {
      kyc.limits = {
        dailyWithdrawal: 5000000,
        maxWalletBalance: 20000000,
      };
    } else if (newTier === KycTier.THRIVE) {
      kyc.limits = {
        dailyWithdrawal: 10000000,
        maxWalletBalance: 50000000,
      };
    }

    const updatedKyc = await this.kycRepository.update(kyc);

    return {
      success: true,
      message: `KYC approved successfully. User upgraded to ${newTier} tier.`,
      userId: updatedKyc.userId,
      previousTier,
      newTier,
      status: updatedKyc.status,
    };
  }

  async rejectKyc(userId: string, rejectionReason: string): Promise<AdminApprovalResult> {
    if (!rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    // Get KYC record
    const kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }

    const previousTier = kyc.currentTier;

    // Update KYC status and rejection reason
    kyc.status = KycStatus.REJECTED;
    kyc.rejectionReason = rejectionReason;

    const updatedKyc = await this.kycRepository.update(kyc);

    return {
      success: true,
      message: 'KYC rejected. User has been notified.',
      userId: updatedKyc.userId,
      previousTier,
      status: updatedKyc.status,
    };
  }

  async getPendingVerifications(): Promise<Array<{
    userId: string;
    userType: string;
    currentTier: string;
    status: string;
    emailVerified: boolean;
    bvnVerified: boolean;
    documentsUploaded: boolean;
    selfieUploaded: boolean;
    businessDocumentsUploaded: boolean;
    businessDetailsSubmitted: boolean;
    limits: any;
    createdAt: string;
    updatedAt: string;
    missingRequirements: string[];
  }>> {
    try {
      const pendingKycs = await this.kycRepository.findPendingVerifications();

      return pendingKycs.map(kyc => ({
        userId: kyc.userId,
        userType: kyc.userType,
        currentTier: kyc.currentTier,
        status: kyc.status,
        emailVerified: kyc.emailVerified,
        bvnVerified: !!kyc.bvnData,
        documentsUploaded: kyc.documents.length > 0,
        selfieUploaded: !!kyc.selfie,
        businessDocumentsUploaded: kyc.businessDocuments.length > 0,
        businessDetailsSubmitted: !!kyc.businessDetails,
        limits: kyc.limits,
        createdAt: kyc.createdAt.toISOString(),
        updatedAt: kyc.updatedAt.toISOString(),
        missingRequirements: this.getMissingRequirements(kyc),
      }));

    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw new BadRequestException('Failed to fetch pending verifications');
    }
  }

  private getMissingRequirements(kyc: any): string[] {
    const requirements: string[] = [];

    if (!kyc.emailVerified) {
      requirements.push('Email verification');
    }

    if (!kyc.bvnData) {
      requirements.push('BVN verification');
    }

    // For enterprise users, business documents can replace ID documents
    if ((kyc.userType as string) === 'ENTERPRISE') {
      if (!kyc.businessDocuments || kyc.businessDocuments.length === 0) {
        requirements.push('Business documents');
      }
    } else {
      // For individual and agent users, ID documents are required
      if (kyc.documents.length === 0) {
        requirements.push('ID documents');
      }
    }

    if (!kyc.selfie) {
      requirements.push('Selfie');
    }

    return requirements;
  }

  async getSingleKyc(userId: string): Promise<{
    userId: string;
    userDetails: {
      name: string;
      email: string;
      phone: string;
      profilePhoto?: string;
    };
    userType: string;
    currentTier: string;
    status: string;
    emailVerified: boolean;
    bvnVerified: boolean;
    documentsUploaded: boolean;
    selfieUploaded: boolean;
    businessDocumentsUploaded: boolean;
    businessDetailsSubmitted: boolean;
    limits: any;
    createdAt: string;
    updatedAt: string;
    documents: Array<{
      documentType: string;
      documentUrl: string;
      uploadedAt: string;
    }>;
    businessDocuments: Array<{
      documentType: string;
      documentUrl: string;
      uploadedAt: string;
    }>;
    businessDetails?: any;
    bvnData?: any;
    selfie?: any;
    rejectionReason?: string;
    missingRequirements: string[];
  }> {
    try {
      const kyc = await this.kycRepository.findByUserId(userId);
      if (!kyc) {
        throw new NotFoundException('KYC record not found');
      }

      const missingRequirements = this.getMissingRequirements(kyc);

      // Fetch user details from user service
      let userDetails;
      try {
        const userDetail = await this.getUserDetailUseCase.execute(userId);
        userDetails = {
          name: userDetail.name,
          email: userDetail.email,
          phone: userDetail.phone,
          profilePhoto: userDetail.profilePhoto,
        };
      } catch (error) {
        // If user not found, use placeholder data
        userDetails = {
          name: 'Unknown User',
          email: 'unknown@example.com',
          phone: '+2340000000000',
          profilePhoto: undefined,
        };
      }

      return {
        userId: kyc.userId,
        userDetails,
        userType: kyc.userType,
        currentTier: kyc.currentTier,
        status: kyc.status,
        emailVerified: kyc.emailVerified,
        bvnVerified: !!kyc.bvnData,
        documentsUploaded: kyc.documents.length > 0,
        selfieUploaded: !!kyc.selfie,
        businessDocumentsUploaded: kyc.businessDocuments.length > 0,
        businessDetailsSubmitted: !!kyc.businessDetails,
        limits: kyc.limits,
        createdAt: kyc.createdAt.toISOString(),
        updatedAt: kyc.updatedAt.toISOString(),
        documents: kyc.documents.map(doc => ({
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
        businessDocuments: kyc.businessDocuments.map(doc => ({
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
        businessDetails: kyc.businessDetails,
        bvnData: kyc.bvnData,
        selfie: kyc.selfie,
        rejectionReason: kyc.rejectionReason,
        missingRequirements,
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching single KYC record:', error);
      throw new BadRequestException('Failed to fetch KYC record');
    }
  }

  async getAllKycRecords(
    page: number = 1,
    limit: number = 10,
    status?: string,
    userType?: string,
    search?: string
  ): Promise<{
    data: Array<{
      userId: string;
      userDetails: {
        name: string;
        email: string;
        phone: string;
        profilePhoto?: string;
      };
      userType: string;
      currentTier: string;
      status: string;
      emailVerified: boolean;
      bvnVerified: boolean;
      documentsUploaded: boolean;
      selfieUploaded: boolean;
      businessDocumentsUploaded: boolean;
      businessDetailsSubmitted: boolean;
      limits: any;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build filter criteria
      const filter: any = {};
      if (status) {
        filter.status = status.toLowerCase();
      }
      if (userType) {
        filter.userType = userType.toLowerCase();
      }

      let kycRecords: any[];
      let total: number;

      if (search) {
        // For search, we need to find KYC records where user details match the search query
        // Get all KYC records that match the basic filters first
        const allKycRecords = await this.kycRepository.findByFilter(filter, 0, 10000); // Get a large number for search
        
        // Fetch user details for all KYC records
        const kycWithUsers = await Promise.all(
          allKycRecords.map(async (kyc) => {
            let userDetails;
            try {
              const userDetail = await this.getUserDetailUseCase.execute(kyc.userId);
              userDetails = {
                name: userDetail.name,
                email: userDetail.email,
                phone: userDetail.phone,
                profilePhoto: userDetail.profilePhoto,
              };
            } catch (error) {
              userDetails = {
                name: 'Unknown User',
                email: 'unknown@example.com',
                phone: '+2340000000000',
                profilePhoto: undefined,
              };
            }

            return {
              ...kyc,
              userDetails
            };
          })
        );

        // Filter by search query (case-insensitive)
        const searchLower = search.toLowerCase();
        const filteredRecords = kycWithUsers.filter(record => 
          record.userDetails.name.toLowerCase().includes(searchLower) ||
          record.userDetails.email.toLowerCase().includes(searchLower) ||
          record.userDetails.phone.includes(search)
        );

        // Apply pagination to filtered results
        total = filteredRecords.length;
        kycRecords = filteredRecords.slice(skip, skip + limit);
      } else {
        // Get total count
        total = await this.kycRepository.countByFilter(filter);
        
        // Get paginated records
        kycRecords = await this.kycRepository.findByFilter(filter, skip, limit);
      }

      // Transform records for response
      const data = await Promise.all(
        kycRecords.map(async (kyc) => {
          // If user details are already fetched during search, use them
          let userDetails;
          if (kyc.userDetails) {
            userDetails = kyc.userDetails;
          } else {
            // Fetch user details from user service
            try {
              const userDetail = await this.getUserDetailUseCase.execute(kyc.userId);
              userDetails = {
                name: userDetail.name,
                email: userDetail.email,
                phone: userDetail.phone,
                profilePhoto: userDetail.profilePhoto,
              };
            } catch (error) {
              // If user not found, use placeholder data
              userDetails = {
                name: 'Unknown User',
                email: 'unknown@example.com',
                phone: '+2340000000000',
                profilePhoto: undefined,
              };
            }
          }

          return {
            userId: kyc.userId,
            userDetails,
            userType: kyc.userType,
            currentTier: kyc.currentTier,
            status: kyc.status,
            emailVerified: kyc.emailVerified,
            bvnVerified: !!kyc.bvnData,
            documentsUploaded: kyc.documents.length > 0,
            selfieUploaded: !!kyc.selfie,
            businessDocumentsUploaded: kyc.businessDocuments.length > 0,
            businessDetailsSubmitted: !!kyc.businessDetails,
            limits: kyc.limits,
            createdAt: kyc.createdAt.toISOString(),
            updatedAt: kyc.updatedAt.toISOString(),
          };
        })
      );

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

    } catch (error) {
      console.error('Error fetching all KYC records:', error);
      throw new BadRequestException('Failed to fetch KYC records');
    }
  }

  async getKycStats(): Promise<{
    total: number;
    sprout: number;
    bloom: number;
    thrive: number;
    pending: number;
    individual: number;
    enterprise: number;
    agent: number;
  }> {
    try {
      const stats = await this.kycRepository.getKycStats();
      
      // Get additional stats by user type
      const individualUsers = await this.kycRepository.findByUserType(KycUserType.INDIVIDUAL);
      const enterpriseUsers = await this.kycRepository.findByUserType(KycUserType.ENTERPRISE);
      const agentUsers = await this.kycRepository.findByUserType(KycUserType.AGENT);

      return {
        ...stats,
        individual: individualUsers.length,
        enterprise: enterpriseUsers.length,
        agent: agentUsers.length,
      };

    } catch (error) {
      console.error('Error fetching KYC stats:', error);
      throw new BadRequestException('Failed to fetch KYC statistics');
    }
  }
}
