import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { VehicleDetailsResponseDto } from '../../presentation/dto/vehicle-details.dto';

@Injectable()
export class GetVehicleDetailsUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
  ) {}

  async execute(userId: string): Promise<VehicleDetailsResponseDto> {
    let vehicleDetails = await this.vehicleDetailsRepository.findByUserId(userId);

    if (!vehicleDetails) {
      throw new NotFoundException('Vehicle details not found');
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
