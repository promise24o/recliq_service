import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { VehicleDetailsResponseDto } from '../../presentation/dto/vehicle-details.dto';
import { DocumentStatus, VehicleStatus } from '../../domain/constants/vehicle.constants';
import { VehicleFileUploadService } from '../../infrastructure/services/vehicle-file-upload.service';
// import { VehicleNotificationService } from '../infrastructure/services/vehicle-notification.service';
import { BadRequestException } from '../../../../core/exceptions/bad-request.exception';
import { NotFoundException } from '../../../../core/exceptions/not-found.exception';

@Injectable()
export class UploadVehicleDocumentUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    private readonly vehicleFileUploadService: VehicleFileUploadService,
    // private readonly vehicleNotificationService: VehicleNotificationService,
  ) {}

  async execute(userId: string, documentType: string, file: Express.Multer.File): Promise<VehicleDetailsResponseDto> {
    // Validate file
    if (!this.vehicleFileUploadService.validateVehicleFileType(file)) {
      throw new BadRequestException('Invalid file type. Allowed types: JPEG, PNG, PDF, GIF');
    }

    if (!this.vehicleFileUploadService.validateVehicleFileSize(file)) {
      throw new BadRequestException('File size too large. Maximum size is 10MB');
    }

    // Get vehicle details
    const vehicleDetails = await this.vehicleDetailsRepository.findByUserId(userId);
    if (!vehicleDetails) {
      throw new NotFoundException('Vehicle details not found. Please create vehicle details first.');
    }

    const oldStatus = vehicleDetails.status;
    let statusChanged = false;

    try {
      // Upload file to Backblaze
      const documentUrl = await this.vehicleFileUploadService.uploadVehicleDocument(
        file,
        userId,
        documentType
      );

      const document = {
        documentType,
        documentUrl,
        status: DocumentStatus.PENDING,
        uploadedAt: new Date()
      };

      const updated = await this.vehicleDetailsRepository.addDocument(userId, document);

      // If vehicle was approved or under review, change status to pending when new document is uploaded
      if ((oldStatus === VehicleStatus.APPROVED || oldStatus === VehicleStatus.UNDER_REVIEW) && 
          updated.status !== VehicleStatus.PENDING) {
        await this.vehicleDetailsRepository.update(userId, { status: VehicleStatus.PENDING });
        updated.status = VehicleStatus.PENDING;
        statusChanged = true;
      }

      // Send notification if status changed to pending
      // TODO: Fix notification service import issue
      if (statusChanged) {
        // await this.vehicleNotificationService.notifyVehicleStatusChange({
        //   userId,
        //   vehicleId: updated._id.toString(),
        //   plateNumber: updated.plateNumber,
        //   oldStatus,
        //   newStatus: VehicleStatus.PENDING
        // });
      }

      const isEnterpriseEligible = this.checkEnterpriseEligibility(updated);

      return {
        vehicleType: updated.vehicleType,
        maxLoadWeight: updated.maxLoadWeight,
        maxLoadVolume: updated.maxLoadVolume,
        materialCompatibility: updated.materialCompatibility,
        plateNumber: updated.plateNumber,
        vehicleColor: updated.vehicleColor,
        registrationExpiryDate: updated.registrationExpiryDate.toISOString(),
        insuranceExpiryDate: updated.insuranceExpiryDate?.toISOString(),
        documents: updated.documents.map(doc => ({
          documentType: doc.documentType,
          documentUrl: doc.documentUrl,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
          verifiedAt: doc.verifiedAt?.toISOString(),
          rejectionReason: doc.rejectionReason
        })),
        fuelType: updated.fuelType,
        status: updated.status,
        isActive: updated.isActive,
        isUnderMaintenance: updated.isUnderMaintenance,
        isEnterpriseEligible,
        updatedAt: updated.updatedAt.toISOString()
      };
    } catch (error) {
      throw new Error(`Vehicle document upload failed: ${error.message}`);
    }
  }

  private checkEnterpriseEligibility(vehicleDetails: any): boolean {
    const hasRequiredCapacity = vehicleDetails.maxLoadWeight >= 500;
    const hasVerifiedDocuments = vehicleDetails.documents.some(doc => doc.status === 'verified');
    const isNotUnderMaintenance = !vehicleDetails.isUnderMaintenance;
    const isActive = vehicleDetails.isActive;

    return hasRequiredCapacity && hasVerifiedDocuments && isNotUnderMaintenance && isActive;
  }
}
