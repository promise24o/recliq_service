import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../domain/constants/vehicle.constants';

export class ApproveVehicleDto {
  @ApiProperty({ 
    enum: VehicleStatus,
    example: VehicleStatus.UNDER_REVIEW,
    description: 'Approval status'
  })
  @IsEnum(VehicleStatus)
  status: VehicleStatus.UNDER_REVIEW | VehicleStatus.APPROVED | VehicleStatus.REJECTED;

  @ApiProperty({ 
    required: false,
    example: 'Vehicle under review - checking documents',
    description: 'Optional status change reason'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VehicleApprovalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  vehicleType: string;

  @ApiProperty()
  plateNumber: string;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ required: false })
  approvedAt?: string;

  @ApiProperty({ required: false })
  approvedBy?: string;

  @ApiProperty({ required: false })
  rejectionReason?: string;

  @ApiProperty()
  updatedAt: string;
}

export class PendingVehiclesQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ 
    required: false,
    enum: VehicleStatus,
    example: VehicleStatus.PENDING
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
