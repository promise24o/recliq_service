import { Injectable, Inject } from '@nestjs/common';
import type { IKycRepository } from '../../domain/repositories/kyc.repository';
import { FileUploadService } from '../../infrastructure/services/file-upload.service';
import { KycUserType, KycTier, KycStatus, DocumentData } from '../../domain/types/kyc.types';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

export interface DocumentUploadResult {
  success: boolean;
  message: string;
  documentType: string;
  documentUrl?: string;
  status?: string;
}

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject('IKycRepository') private kycRepository: IKycRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async uploadKycDocument(
    userId: string,
    documentType: 'id_card' | 'passport' | 'utility_bill' | 'business_registration' | 'tax_clearance' | 'memorandum',
    file: Express.Multer.File
  ): Promise<DocumentUploadResult> {
    // Validate file
    if (!this.fileUploadService.validateKycFileType(file)) {
      throw new BadRequestException('Invalid file type. Allowed types: JPEG, PNG, PDF, GIF');
    }

    if (!this.fileUploadService.validateKycFileSize(file)) {
      throw new BadRequestException('File size too large. Maximum size is 10MB');
    }

    // Get KYC record
    let kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found. Please initialize KYC first.');
    }

    // Validate document type based on user type
    this.validateDocumentTypeForUser(kyc.userType, documentType);

    try {
      // Upload file to Backblaze
      const documentUrl = await this.fileUploadService.uploadKycDocument(
        file,
        userId,
        documentType
      );

      // Create document data
      const documentData: DocumentData = {
        documentType,
        documentUrl,
        uploadedAt: new Date(),
        verified: false,
      };

      // Handle business documents separately for enterprise users
      if (kyc.userType === ('ENTERPRISE' as KycUserType)) {
        if (!['business_registration', 'tax_clearance', 'memorandum', 'utility_bill'].includes(documentType)) {
          throw new BadRequestException('Invalid document type for enterprise user');
        }

        kyc = await this.kycRepository.addBusinessDocument(userId, documentData);
        
        // Change status to IN_PROGRESS when documents are uploaded (in review)
        kyc.status = KycStatus.IN_PROGRESS;
        await this.kycRepository.update(kyc);
        
        return {
          success: true,
          message: 'Business document uploaded successfully. Your KYC is now in review.',
          documentType,
          documentUrl,
          status: 'in_review',
        };
      }

      // Handle individual/agent documents
      if (kyc.userType === ('INDIVIDUAL' as KycUserType)) {
        throw new BadRequestException('Individual users do not need to upload documents. Only BVN verification is required.');
      }

      // Handle agent documents (passport/id_card)
      if (kyc.userType === ('AGENT' as KycUserType)) {
        if (!['id_card', 'passport'].includes(documentType)) {
          throw new BadRequestException('Invalid document type for agent. Only ID card or passport allowed.');
        }

        kyc = await this.kycRepository.addDocument(userId, documentData);

        // Change status to IN_PROGRESS when documents are uploaded (in review)
        kyc.status = KycStatus.IN_PROGRESS;
        await this.kycRepository.update(kyc);

        return {
          success: true,
          message: 'Document uploaded successfully. Your KYC is now in review.',
          documentType,
          documentUrl,
          status: 'in_review',
        };
      }

      return {
        success: true,
        message: 'Document uploaded successfully.',
        documentType,
        documentUrl,
        status: kyc.status,
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Document upload error:', error);
      throw new BadRequestException('Document upload failed. Please try again later.');
    }
  }

  private validateDocumentTypeForUser(userType: KycUserType, documentType: string): void {
    switch (userType) {
      case ('INDIVIDUAL' as KycUserType):
        throw new BadRequestException('Individual users do not need to upload documents. Only BVN verification is required.');
      
      case ('ENTERPRISE' as KycUserType):
        if (!['business_registration', 'tax_clearance', 'memorandum', 'utility_bill'].includes(documentType)) {
          throw new BadRequestException('Invalid document type for enterprise user. Allowed: business_registration, tax_clearance, memorandum, utility_bill');
        }
        break;
      
      case ('AGENT' as KycUserType):
        if (!['id_card', 'passport'].includes(documentType)) {
          throw new BadRequestException('Invalid document type for agent. Allowed: id_card, passport');
        }
        break;
    }
  }

  async uploadKycSelfie(
    userId: string,
    file: Express.Multer.File
  ): Promise<DocumentUploadResult> {
    // Validate file
    if (!this.fileUploadService.validateSelfieFileType(file)) {
      throw new BadRequestException('Invalid file type. Allowed types: JPEG, PNG');
    }

    if (!this.fileUploadService.validateSelfieFileSize(file)) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }

    // Get KYC record
    let kyc = await this.kycRepository.findByUserId(userId);
    if (!kyc) {
      throw new NotFoundException('KYC record not found. Please initialize KYC first.');
    }

    // Only agents can upload selfies
    if (kyc.userType !== ('AGENT' as KycUserType)) {
      throw new BadRequestException('Selfie upload is only available for agents');
    }

    try {
      // Upload selfie to Backblaze
      const selfieUrl = await this.fileUploadService.uploadKycSelfie(file, userId);

      // Create selfie data
      const selfieData = {
        selfieUrl,
        uploadedAt: new Date(),
        verified: false,
      };

      kyc = await this.kycRepository.setSelfie(userId, selfieData);

      // Change status to IN_PROGRESS when selfie is uploaded
      kyc.status = KycStatus.IN_PROGRESS;
      await this.kycRepository.update(kyc);

      return {
        success: true,
        message: 'Selfie uploaded successfully. Your KYC is now in review.',
        documentType: 'selfie',
        documentUrl: selfieUrl,
        status: 'in_review',
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Selfie upload error:', error);
      throw new BadRequestException('Selfie upload failed. Please try again later.');
    }
  }
}
