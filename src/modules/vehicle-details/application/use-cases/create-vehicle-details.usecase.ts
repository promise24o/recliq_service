import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { CreateVehicleDetailsDto, VehicleDetailsResponseDto } from '../../presentation/dto/vehicle-details.dto';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';

@Injectable()
export class CreateVehicleDetailsUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
  ) {}

  async execute(userId: string, dto: CreateVehicleDetailsDto): Promise<VehicleDetailsResponseDto> {
    const existing = await this.vehicleDetailsRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictException('Vehicle details already exist');
    }

    const vehicleDetails = await this.vehicleDetailsRepository.create(userId, {
      ...dto,
      registrationExpiryDate: new Date(dto.registrationExpiryDate),
      insuranceExpiryDate: dto.insuranceExpiryDate ? new Date(dto.insuranceExpiryDate) : undefined,
      status: VehicleStatus.PENDING,
      isActive: false, // Should be false until approved
      isUnderMaintenance: false,
      isEnterpriseEligible: false
    });

    return {
      vehicleType: vehicleDetails.vehicleType,
      maxLoadWeight: vehicleDetails.maxLoadWeight,
      maxLoadVolume: vehicleDetails.maxLoadVolume,
      materialCompatibility: vehicleDetails.materialCompatibility,
      plateNumber: vehicleDetails.plateNumber,
      vehicleColor: vehicleDetails.vehicleColor,
      registrationExpiryDate: vehicleDetails.registrationExpiryDate.toISOString(),
      insuranceExpiryDate: vehicleDetails.insuranceExpiryDate?.toISOString(),
      documents: [],
      fuelType: vehicleDetails.fuelType,
      status: vehicleDetails.status,
      isActive: vehicleDetails.isActive,
      isUnderMaintenance: vehicleDetails.isUnderMaintenance,
      isEnterpriseEligible: vehicleDetails.isEnterpriseEligible,
      updatedAt: vehicleDetails.updatedAt.toISOString()
    };
  }
}
