import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';

export interface VehicleWithUserDetailsDto {
  id: string;
  userId: string;
  vehicleType: 'motorcycle' | 'tricycle' | 'car' | 'mini_truck' | 'truck' | 'specialized_recycling';
  maxLoadWeight: number;
  maxLoadVolume?: number;
  materialCompatibility: string[];
  plateNumber: string;
  vehicleColor: string;
  registrationExpiryDate: string;
  insuranceExpiryDate?: string;
  documents: Array<{
    id: string;
    type: string;
    url: string;
    status: string;
    uploadedAt: string;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
  }>;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  status: string;
  isActive: boolean;
  isUnderMaintenance: boolean;
  isEnterpriseEligible: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    profilePhoto?: string;
    location?: {
      type: "Point";
      coordinates: [number, number];
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

@Injectable()
export class GetVehicleWithUserUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(vehicleId: string): Promise<VehicleWithUserDetailsDto> {
    // Find vehicle by ID
    const vehicle = await this.vehicleDetailsRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Find user details
    const user = await this.userRepository.findById(vehicle.userId.toString());
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Map documents if they exist
    const documents = vehicle.documents?.map((doc, index) => ({
      id: index.toString(),
      type: doc.documentType,
      url: doc.documentUrl,
      status: doc.status,
      uploadedAt: doc.uploadedAt.toISOString(),
      verifiedAt: doc.verifiedAt?.toISOString(),
      verifiedBy: undefined, // Not available in VehicleDocument interface
      rejectionReason: doc.rejectionReason
    }));

    return {
      id: vehicle._id.toString(),
      userId: vehicle.userId.toString(),
      vehicleType: vehicle.vehicleType,
      maxLoadWeight: vehicle.maxLoadWeight,
      maxLoadVolume: vehicle.maxLoadVolume,
      materialCompatibility: vehicle.materialCompatibility,
      plateNumber: vehicle.plateNumber,
      vehicleColor: vehicle.vehicleColor,
      registrationExpiryDate: vehicle.registrationExpiryDate.toISOString(),
      insuranceExpiryDate: vehicle.insuranceExpiryDate?.toISOString(),
      documents,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      isActive: vehicle.isActive,
      isUnderMaintenance: vehicle.isUnderMaintenance,
      isEnterpriseEligible: vehicle.isEnterpriseEligible,
      approvedAt: vehicle.approvedAt?.toISOString(),
      approvedBy: vehicle.approvedBy?.toString(),
      rejectionReason: vehicle.rejectionReason,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        location: user.location,
      }
    };
  }
}
