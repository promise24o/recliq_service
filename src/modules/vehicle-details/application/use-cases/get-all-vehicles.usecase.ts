import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { PendingVehiclesQueryDto, VehicleApprovalResponseDto } from '../../presentation/dto/vehicle-approval.dto';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';

export interface VehicleWithUserDto extends VehicleApprovalResponseDto {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

@Injectable()
export class GetAllVehiclesUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: PendingVehiclesQueryDto): Promise<{
    vehicles: VehicleWithUserDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { page = 1, limit = 20, status } = query;
    
    const result = await this.vehicleDetailsRepository.findByStatus(
      page,
      limit,
      status ? String(status) : undefined
    );

    // Fetch user details for each vehicle
    const vehiclesWithUsers = await Promise.all(
      result.vehicles.map(async (vehicle) => {
        const user = await this.userRepository.findById(vehicle.userId.toString());
        
        return {
          id: vehicle._id.toString(),
          userId: vehicle.userId.toString(),
          vehicleType: vehicle.vehicleType,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
          approvedAt: vehicle.approvedAt?.toISOString(),
          approvedBy: vehicle.approvedBy?.toString(),
          rejectionReason: vehicle.rejectionReason,
          updatedAt: vehicle.updatedAt.toISOString(),
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
          } : undefined
        };
      })
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      vehicles: vehiclesWithUsers,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}
