import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import { DocumentStatus, DocumentType, VehicleStatus } from '../../domain/constants/vehicle.constants';
// import { VehicleNotificationService } from '../../infrastructure/services/vehicle-notification.service';

export interface VerifyDocumentDto {
  status: DocumentStatus.VERIFIED | DocumentStatus.REJECTED;
  verificationNote?: string;
  rejectionReason?: string;
}

export interface DocumentVerificationResult {
  success: boolean;
  message: string;
  documentType: string;
  status: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

@Injectable()
export class VerifyVehicleDocumentUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    // private readonly vehicleNotificationService: VehicleNotificationService,
  ) {}

  async execute(
    userId: string,
    documentType: string,
    verificationData: VerifyDocumentDto,
    adminId: string
  ): Promise<DocumentVerificationResult> {
    const vehicleDetails = await this.vehicleDetailsRepository.findByUserId(userId);

    if (!vehicleDetails) {
      throw new Error('Vehicle details not found');
    }

    // Find the document to verify
    const documentIndex = vehicleDetails.documents.findIndex(
      doc => doc.documentType === documentType
    );

    if (documentIndex === -1) {
      throw new Error(`Document of type '${documentType}' not found`);
    }

    // Store old status for notification
    const oldStatus = vehicleDetails.documents[documentIndex].status;

    // Update document status
    vehicleDetails.documents[documentIndex].status = verificationData.status;
    
    if (verificationData.status === DocumentStatus.VERIFIED) {
      vehicleDetails.documents[documentIndex].verifiedAt = new Date();
      vehicleDetails.documents[documentIndex].rejectionReason = undefined;
    } else {
      vehicleDetails.documents[documentIndex].verifiedAt = undefined;
      vehicleDetails.documents[documentIndex].rejectionReason = verificationData.rejectionReason;
    }

    // Save updated vehicle details
    await this.vehicleDetailsRepository.update(userId, {
      documents: vehicleDetails.documents
    });

    // Send notification for document status change
    // TODO: Fix notification service import issue
    // await this.vehicleNotificationService.notifyDocumentStatusChange({
    //   userId,
    //   vehicleId: vehicleDetails._id.toString(),
    //   plateNumber: vehicleDetails.plateNumber,
    //   documentType: documentType as DocumentType,
    //   oldStatus,
    //   newStatus: verificationData.status,
    //   rejectionReason: verificationData.rejectionReason,
    //   verifiedBy: adminId,
    // });

    // Check if all documents are verified and update vehicle status accordingly
    const allDocumentsVerified = vehicleDetails.documents.every(
      doc => doc.status === DocumentStatus.VERIFIED
    );

    if (allDocumentsVerified && vehicleDetails.status === VehicleStatus.PENDING) {
      const oldVehicleStatus = vehicleDetails.status;
      await this.vehicleDetailsRepository.updateApprovalStatus(
        userId,
        VehicleStatus.UNDER_REVIEW,
        adminId,
        'All documents verified - ready for final approval'
      );

      // Send notification for vehicle status change
      // TODO: Fix notification service import issue
      // await this.vehicleNotificationService.notifyVehicleStatusChange({
      //   userId,
      //   vehicleId: vehicleDetails._id.toString(),
      //   plateNumber: vehicleDetails.plateNumber,
      //   oldStatus: oldVehicleStatus,
      //   newStatus: VehicleStatus.UNDER_REVIEW,
      //   approvedBy: adminId,
      // });
    }

    return {
      success: true,
      message: `Document ${verificationData.status === DocumentStatus.VERIFIED ? 'verified' : 'rejected'} successfully`,
      documentType,
      status: verificationData.status,
      verifiedAt: verificationData.status === DocumentStatus.VERIFIED 
        ? vehicleDetails.documents[documentIndex].verifiedAt?.toISOString()
        : undefined,
      rejectionReason: verificationData.status === DocumentStatus.REJECTED 
        ? verificationData.rejectionReason 
        : undefined
    };
  }
}
