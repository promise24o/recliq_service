import { Injectable, Inject } from '@nestjs/common';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { ApproveVehicleDto, VehicleApprovalResponseDto } from '../../presentation/dto/vehicle-approval.dto';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';
// import { VehicleNotificationService } from '../infrastructure/services/vehicle-notification.service';

@Injectable()
export class ApproveVehicleUseCase {
  constructor(
    @Inject('IVehicleDetailsRepository')
    private readonly vehicleDetailsRepository: IVehicleDetailsRepository,
    // private readonly vehicleNotificationService: VehicleNotificationService,
  ) {}

  async execute(
    userId: string, 
    approvalData: ApproveVehicleDto, 
    adminId: string
  ): Promise<VehicleApprovalResponseDto> {
    console.log(`Approving vehicle for user ${userId} with status ${approvalData.status}`);
    
    const vehicleDetails = await this.vehicleDetailsRepository.findByUserId(userId);

    if (!vehicleDetails) {
      throw new Error('Vehicle details not found');
    }

    // Store old status for notification
    const oldStatus = vehicleDetails.status;
    console.log(`Vehicle ${vehicleDetails._id} status changing from ${oldStatus} to ${approvalData.status}`);

    // Update vehicle status and approval details
    const updatedVehicle = await this.vehicleDetailsRepository.updateApprovalStatus(
      userId,
      approvalData.status,
      adminId,
      approvalData.reason
    );
    
    console.log(`Vehicle updated successfully. New status: ${updatedVehicle.status}`);

    // Send notification for status change (don't block approval if notification fails)
    // TODO: Fix notification service import issue
    // try {
    //   await this.vehicleNotificationService.notifyVehicleStatusChange({
    //     userId,
    //     vehicleId: updatedVehicle._id.toString(),
    //     plateNumber: updatedVehicle.plateNumber,
    //     oldStatus,
    //     newStatus: updatedVehicle.status,
    //     rejectionReason: updatedVehicle.rejectionReason,
    //     approvedBy: adminId,
    //   });
    // } catch (notificationError) {
    //   console.error('Failed to send vehicle status notification:', notificationError);
    //   // Continue with approval even if notification fails
    // }

    // Update enterprise eligibility based on approval status
    if (approvalData.status === VehicleStatus.APPROVED) {
      await this.vehicleDetailsRepository.updateEnterpriseEligibility(userId, true);
    } else {
      await this.vehicleDetailsRepository.updateEnterpriseEligibility(userId, false);
    }

    const response = {
      id: updatedVehicle._id.toString(),
      userId: updatedVehicle.userId.toString(),
      vehicleType: updatedVehicle.vehicleType,
      plateNumber: updatedVehicle.plateNumber,
      status: updatedVehicle.status,
      approvedAt: updatedVehicle.approvedAt?.toISOString(),
      approvedBy: updatedVehicle.approvedBy?.toString(),
      rejectionReason: updatedVehicle.rejectionReason,
      updatedAt: updatedVehicle.updatedAt.toISOString()
    };
    
    console.log('Returning approval response:', response);
    return response;
  }
}
