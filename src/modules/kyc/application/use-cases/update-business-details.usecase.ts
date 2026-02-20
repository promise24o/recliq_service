import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { Kyc, KycUserType, BusinessDetails } from '../../domain/types/kyc.types';
import { KycEntity } from '../../domain/entities/kyc.entity';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface UpdateBusinessDetailsResult {
  success: boolean;
  message: string;
  userId: string;
  businessDetails: BusinessDetails;
  status: string;
  nextStep?: string;
}

@Injectable()
export class UpdateBusinessDetailsUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
  ) {}

  async execute(
    userId: string,
    businessDetails: BusinessDetails
  ): Promise<UpdateBusinessDetailsResult> {
    // Get KYC record
    const kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found. Please initialize KYC first.');
    }

    // Validate user type
    if (kyc.userType !== ('ENTERPRISE' as KycUserType)) {
      throw new BadRequestException('Business details can only be updated for enterprise users');
    }

    // Validate business details
    this.validateBusinessDetails(businessDetails);

    // Update business details
    const kycEntity = new KycEntity(
      kyc.id,
      kyc.userId,
      kyc.userType,
      kyc.currentTier,
      kyc.status,
      kyc.emailVerified,
      kyc.documents,
      kyc.limits,
      kyc.createdAt,
      kyc.updatedAt,
      kyc.bvnData,
      kyc.businessDocuments,
      kyc.selfie,
      kyc.businessDetails,
      kyc.rejectionReason
    );
    
    kycEntity.updateBusinessDetails(businessDetails);
    
    // Save updated KYC record
    const updatedKyc = await this.kycRepository.update(kycEntity);

    // Determine next step
    const nextStep = this.getNextStep(updatedKyc);

    return {
      success: true,
      message: 'Business details updated successfully',
      userId: updatedKyc.userId,
      businessDetails: updatedKyc.businessDetails!,
      status: updatedKyc.status,
      nextStep,
    };
  }

  private validateBusinessDetails(businessDetails: BusinessDetails): void {
    if (!businessDetails.businessName || businessDetails.businessName.trim().length < 2) {
      throw new BadRequestException('Business name is required and must be at least 2 characters');
    }

    if (!businessDetails.businessAddress || businessDetails.businessAddress.trim().length < 5) {
      throw new BadRequestException('Business address is required and must be at least 5 characters');
    }

    if (!businessDetails.businessDescription || businessDetails.businessDescription.trim().length < 10) {
      throw new BadRequestException('Business description is required and must be at least 10 characters');
    }

    if (!businessDetails.businessEmail || !this.isValidEmail(businessDetails.businessEmail)) {
      throw new BadRequestException('Valid business email is required');
    }

    if (!businessDetails.businessPhone || !this.isValidPhone(businessDetails.businessPhone)) {
      throw new BadRequestException('Valid business phone number is required');
    }

    if (!businessDetails.natureOfBusiness) {
      throw new BadRequestException('Nature of business is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Nigerian phone number validation (simplified)
    const phoneRegex = /^\+?234[0-9]{10}$|^0[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private getNextStep(kyc: Kyc): string {
    if (kyc.businessDocuments.length === 0) {
      return 'Please upload business documents (registration certificate, utility bill)';
    }

    if (kyc.status === 'pending') {
      return 'Your KYC is pending admin approval';
    }

    return 'Business details complete. Please upload required documents.';
  }
}
