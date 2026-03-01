import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { UpdateVehicleDetailsDto, VehicleDetailsResponseDto } from '../../presentation/dto/vehicle-details.dto';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';
// import { VehicleNotificationService } from '../infrastructure/services/vehicle-notification.service';

@Injectable()
export class UpdateVehicleDetailsUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    // private readonly vehicleNotificationService: VehicleNotificationService,
  ) {}

  async execute(userId: string, dto: UpdateVehicleDetailsDto): Promise<VehicleDetailsResponseDto> {
    // Get current vehicle details to check status change
    const currentVehicle = await this.vehicleDetailsRepository.findByUserId(userId);
    if (!currentVehicle) {
      throw new Error('Vehicle details not found');
    }

    const updateData: any = {};
    let hasDetailsChanged = false;

    if (dto.vehicleType !== undefined) {
      updateData.vehicleType = dto.vehicleType;
      hasDetailsChanged = true;
    }
    if (dto.maxLoadWeight !== undefined) {
      updateData.maxLoadWeight = dto.maxLoadWeight;
      hasDetailsChanged = true;
    }
    if (dto.maxLoadVolume !== undefined) {
      updateData.maxLoadVolume = dto.maxLoadVolume;
      hasDetailsChanged = true;
    }
    if (dto.materialCompatibility !== undefined) {
      updateData.materialCompatibility = dto.materialCompatibility;
      hasDetailsChanged = true;
    }
    if (dto.plateNumber !== undefined) {
      updateData.plateNumber = dto.plateNumber;
      hasDetailsChanged = true;
    }
    if (dto.vehicleColor !== undefined) {
      updateData.vehicleColor = dto.vehicleColor;
      hasDetailsChanged = true;
    }
    if (dto.registrationExpiryDate !== undefined) {
      updateData.registrationExpiryDate = new Date(dto.registrationExpiryDate);
      hasDetailsChanged = true;
    }
    if (dto.insuranceExpiryDate !== undefined) {
      updateData.insuranceExpiryDate = new Date(dto.insuranceExpiryDate);
      hasDetailsChanged = true;
    }
    if (dto.fuelType !== undefined) {
      updateData.fuelType = dto.fuelType;
      hasDetailsChanged = true;
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isUnderMaintenance !== undefined) updateData.isUnderMaintenance = dto.isUnderMaintenance;

    // If vehicle details changed and status was approved/under_review, change to pending
    if (hasDetailsChanged && 
        (currentVehicle.status === VehicleStatus.APPROVED || 
         currentVehicle.status === VehicleStatus.UNDER_REVIEW)) {
      updateData.status = VehicleStatus.PENDING;
    }

    const vehicleDetails = await this.vehicleDetailsRepository.update(userId, updateData);

    // Send notification if status changed to pending
    // TODO: Fix notification service import issue
    if (hasDetailsChanged && 
        updateData.status === VehicleStatus.PENDING && 
        currentVehicle.status !== VehicleStatus.PENDING) {
      // await this.vehicleNotificationService.notifyVehicleStatusChange({
      //   userId,
      //   vehicleId: vehicleDetails._id.toString(),
      //   plateNumber: vehicleDetails.plateNumber,
      //   oldStatus: currentVehicle.status,
      //   newStatus: VehicleStatus.PENDING
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
