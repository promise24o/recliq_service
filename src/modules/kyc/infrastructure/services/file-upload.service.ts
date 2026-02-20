import { Injectable, Logger } from '@nestjs/common';
import { BackblazeService } from '../../../auth/infrastructure/storage/backblaze.service';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private backblazeService: BackblazeService) {}

  /**
   * Upload KYC document to Backblaze B2
   */
  async uploadKycDocument(
    file: Express.Multer.File,
    userId: string,
    documentType: string
  ): Promise<string> {
    try {
      const fileName = `kyc/${userId}/${documentType}/${Date.now()}-${file.originalname}`;
      
      // Use existing Backblaze service but adapt for KYC
      const fileUrl = await this.backblazeService.uploadProfilePhoto(
        `kyc/${userId}/${documentType}`,
        file.buffer,
        file.mimetype,
        `${Date.now()}-${file.originalname}`
      );
      
      this.logger.log(`KYC document uploaded successfully: ${fileName}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading KYC document:', error);
      throw new Error(`KYC document upload failed: ${error.message}`);
    }
  }

  /**
   * Upload KYC selfie to Backblaze B2
   */
  async uploadKycSelfie(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    try {
      const fileUrl = await this.backblazeService.uploadProfilePhoto(
        `kyc/${userId}/selfie`,
        file.buffer,
        file.mimetype,
        `selfie-${Date.now()}-${file.originalname}`
      );
      
      this.logger.log(`KYC selfie uploaded successfully for user: ${userId}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading KYC selfie:', error);
      throw new Error(`KYC selfie upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Backblaze B2
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await this.backblazeService.deleteProfilePhoto(fileUrl);
      this.logger.log(`File deleted successfully: ${fileUrl}`);
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Validate file type for KYC documents
   */
  validateKycFileType(file: Express.Multer.File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'image/gif'
    ];
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Validate file size for KYC documents (max 10MB)
   */
  validateKycFileSize(file: Express.Multer.File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  /**
   * Validate selfie file type
   */
  validateSelfieFileType(file: Express.Multer.File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Validate selfie file size (max 5MB)
   */
  validateSelfieFileSize(file: Express.Multer.File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  }
}
