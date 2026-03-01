import { Injectable, Logger } from '@nestjs/common';
import { BackblazeService } from '../../../auth/infrastructure/storage/backblaze.service';

@Injectable()
export class VehicleFileUploadService {
  private readonly logger = new Logger(VehicleFileUploadService.name);

  constructor(private backblazeService: BackblazeService) {}

  /**
   * Upload vehicle document to Backblaze B2
   */
  async uploadVehicleDocument(
    file: Express.Multer.File,
    userId: string,
    documentType: string
  ): Promise<string> {
    try {
      const fileName = `vehicle-documents/${userId}/${documentType}/${Date.now()}-${file.originalname}`;
      
      // Use existing Backblaze service but adapt for vehicle documents
      const fileUrl = await this.backblazeService.uploadProfilePhoto(
        `vehicle-documents/${userId}/${documentType}`,
        file.buffer,
        file.mimetype,
        `${Date.now()}-${file.originalname}`
      );
      
      this.logger.log(`Vehicle document uploaded successfully: ${fileName}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading vehicle document:', error);
      throw new Error(`Vehicle document upload failed: ${error.message}`);
    }
  }

  /**
   * Delete vehicle document from Backblaze B2
   */
  async deleteVehicleDocument(fileUrl: string): Promise<void> {
    try {
      await this.backblazeService.deleteProfilePhoto(fileUrl);
      this.logger.log(`Vehicle document deleted successfully: ${fileUrl}`);
    } catch (error) {
      this.logger.error('Error deleting vehicle document:', error);
      throw new Error(`Vehicle document deletion failed: ${error.message}`);
    }
  }

  /**
   * Validate file type for vehicle documents
   */
  validateVehicleFileType(file: Express.Multer.File): boolean {
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
   * Validate file size for vehicle documents (max 10MB)
   */
  validateVehicleFileSize(file: Express.Multer.File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }
}
