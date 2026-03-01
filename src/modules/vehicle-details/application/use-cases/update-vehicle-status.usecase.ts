import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { UpdateVehicleStatusDto, VehicleDetailsResponseDto } from '../../presentation/dto/vehicle-details.dto';
// import { VehicleNotificationService } from '../../infrastructure/services/vehicle-notification.service';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';

@Injectable()
export class UpdateVehicleStatusUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    // private readonly vehicleNotificationService: VehicleNotificationService,
  ) {}

  async execute(userId: string, dto: UpdateVehicleStatusDto): Promise<VehicleDetailsResponseDto> {
    // Get current vehicle details to track status change
    const currentVehicle = await this.vehicleDetailsRepository.findByUserId(userId);
    const oldStatus = currentVehicle?.status || VehicleStatus.PENDING;

    const vehicleDetails = await this.vehicleDetailsRepository.updateStatus(
      userId, 
      dto.isActive, 
      dto.isUnderMaintenance
    );

    // Check if status changed and send notification
    // TODO: Fix notification service import issue
    if (oldStatus !== vehicleDetails.status) {
      // await this.vehicleNotificationService.notifyVehicleStatusChange({
      //   userId,
      //   vehicleId: vehicleDetails._id.toString(),
      //   plateNumber: vehicleDetails.plateNumber,
      //   oldStatus,
      //   newStatus: vehicleDetails.status,
      // });
    }

    const isEnterpriseEligible = this.checkEnterpriseEligibility(vehicleDetails);

    return {
      vehicleType: vehicleDetails.vehicleType,
      maxLoadWeight: vehicleDetails.maxLoadWeight,
      maxLoadVolume: vehicleDetails.maxLoadVolume,
      materialCompatibility: vehicleDetails.materialCompatibility,
      plateNumber: vehicleDetails.plateNumber,
      vehicleColor: vehicleDetails.vehicleColor,
      registrationExpiryDate: vehicleDetails.registrationExpiryDate.toISOString(),
      insuranceExpiryDate: vehicleDetails.insuranceExpiryDate?.toISOString(),
      documents: vehicleDetails.documents.map(doc => ({
        documentType: doc.documentType,
        documentUrl: doc.documentUrl,
        status: doc.status,
        uploadedAt: doc.uploadedAt.toISOString(),
        verifiedAt: doc.verifiedAt?.toISOString(),
        rejectionReason: doc.rejectionReason
      })),
      fuelType: vehicleDetails.fuelType,
      status: vehicleDetails.status,
      isActive: vehicleDetails.isActive,
      isUnderMaintenance: vehicleDetails.isUnderMaintenance,
      isEnterpriseEligible,
      updatedAt: vehicleDetails.updatedAt.toISOString()
    };
  }

  private checkEnterpriseEligibility(vehicleDetails: any): boolean {
    const hasRequiredCapacity = vehicleDetails.maxLoadWeight >= 500;
    const hasVerifiedDocuments = vehicleDetails.documents.some(doc => doc.status === 'verified');
    const isNotUnderMaintenance = !vehicleDetails.isUnderMaintenance;
    const isActive = vehicleDetails.isActive;

    return hasRequiredCapacity && hasVerifiedDocuments && isNotUnderMaintenance && isActive;
  }
}
