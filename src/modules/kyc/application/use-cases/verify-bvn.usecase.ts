import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { PaystackService } from '../../infrastructure/services/paystack.service';
import { KycUserType, KycTier, KycStatus, BvnData } from '../../domain/types/kyc.types';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface BvnVerificationResult {
  success: boolean;
  message: string;
  tier?: string;
  limits: {
    dailyWithdrawal: number;
    maxWalletBalance: number;
  };
}

@Injectable()
export class VerifyBvnUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
    private paystackService: PaystackService,
  ) {}

  async execute(
    userId: string,
    bvn: string,
    accountNumber: string,
    bankCode: string,
    userName: string
  ): Promise<BvnVerificationResult> {
    // Validate BVN format
    if (!this.paystackService.validateBvnFormat(bvn)) {
      throw new BadRequestException('Invalid BVN format. BVN must be 11 digits');
    }

    // Validate account number format
    if (!this.paystackService.validateAccountNumberFormat(accountNumber)) {
      throw new BadRequestException('Invalid account number format');
    }

    // Get or create KYC record
    let kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found. Please initiate KYC process first.');
    }

    // Check if user is eligible for BVN verification
    if (kyc.userType === KycUserType.ENTERPRISE) {
      throw new BadRequestException('Enterprise users do not require BVN verification');
    }

    // Check if KYC is already verified
    if (kyc.status === KycStatus.VERIFIED) {
      throw new BadRequestException('KYC already verified for this user');
    }

    // Split user name into first and last name
    const nameParts = userName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    try {
      // Verify BVN with Paystack
      const response = await this.paystackService.verifyBvn(
        bvn,
        accountNumber,
        bankCode,
        firstName,
        lastName
      );

      if (!response.status || !response.data) {
        throw new BadRequestException('BVN verification failed. Please check your details and try again.');
      }

      // Check if name matches
      if (!response.data.first_name || !response.data.last_name) {
        throw new BadRequestException('Name mismatch detected. Please ensure your bank account name matches your registered name.');
      }

      // Update KYC status to verified (do not store BVN data)
      if (kyc.currentTier === KycTier.SPROUT && kyc.emailVerified) {
        // Auto-upgrade to Bloom tier
        kyc.currentTier = KycTier.BLOOM;
        kyc.status = KycStatus.VERIFIED;
        kyc.limits = {
          dailyWithdrawal: 5000000,  // ₦5M daily withdrawal
          maxWalletBalance: 20000000, // ₦20M max wallet balance
        };
        await this.kycRepository.update(kyc);

        return {
          success: true,
          message: 'BVN verification successful. You have been upgraded to Bloom tier.',
          tier: kyc.currentTier,
          limits: kyc.limits,
        };
      } else {
        // Just update status to verified
        kyc.status = KycStatus.VERIFIED;
        await this.kycRepository.update(kyc);

        return {
          success: true,
          message: 'BVN verification successful. Your KYC status has been updated.',
          tier: kyc.currentTier,
          limits: kyc.limits,
        };
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Log the actual Paystack error and return specific message
      console.error('Paystack BVN verification error:', error);
      
      // Extract the actual error message from Paystack response
      const errorMessage = error.response?.data?.message || error.message || 'BVN verification failed. Please try again later.';
      
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Get list of banks for BVN verification
   */
  async getBanks(): Promise<any[]> {
    try {
      return await this.paystackService.getBanks();
    } catch (error) {
      throw new BadRequestException('Failed to fetch banks. Please try again later.');
    }
  }

  /**
   * Resolve bank account details
   */
  async resolveAccount(accountNumber: string, bankCode: string): Promise<{
    account_number: string;
    account_name: string;
    bank_id: number;
  }> {
    try {
      return await this.paystackService.resolveAccount(accountNumber, bankCode);
    } catch (error) {
      throw new BadRequestException('Failed to resolve account. Please check your account details.');
    }
  }
}
