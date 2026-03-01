import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Query, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { ApproveVehicleUseCase } from '../../application/use-cases/approve-vehicle.usecase';
import { GetPendingVehiclesUseCase } from '../../application/use-cases/get-pending-vehicles.usecase';
import { GetAllVehiclesUseCase } from '../../application/use-cases/get-all-vehicles.usecase';
import { GetVehicleWithUserUseCase } from '../../application/use-cases/get-vehicle-with-user.usecase';
import { VerifyVehicleDocumentUseCase, type VerifyDocumentDto } from '../../application/use-cases/verify-vehicle-document.usecase';
import { ApproveVehicleDto, PendingVehiclesQueryDto, VehicleApprovalResponseDto } from '../dto/vehicle-approval.dto';
import { DocumentVerificationResultDto } from '../dto/verify-document.dto';

@ApiTags('Vehicle Approval')
@Controller('vehicle-details/approval')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleApprovalController {
  constructor(
    private readonly approveVehicleUseCase: ApproveVehicleUseCase,
    private readonly getPendingVehiclesUseCase: GetPendingVehiclesUseCase,
    private readonly getAllVehiclesUseCase: GetAllVehiclesUseCase,
    private readonly getVehicleWithUserUseCase: GetVehicleWithUserUseCase,
    private readonly verifyVehicleDocumentUseCase: VerifyVehicleDocumentUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all vehicles with optional status filter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehicles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        vehicles: {
          type: 'array',
          items: { $ref: '#/components/schemas/VehicleApprovalResponseDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    }
  })
  async getAllVehicles(
    @Query() query: PendingVehiclesQueryDto,
  ) {
    return this.getAllVehiclesUseCase.execute(query);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending vehicle approvals' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pending vehicles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        vehicles: {
          type: 'array',
          items: { $ref: '#/components/schemas/VehicleApprovalResponseDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    }
  })
  async getPendingVehicles(
    @Query() query: PendingVehiclesQueryDto,
  ) {
    return this.getPendingVehiclesUseCase.execute(query);
  }

  @Put(':userId/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve or reject vehicle details' })
  @ApiParam({ name: 'userId', description: 'User ID of the vehicle owner' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehicle approval status updated successfully',
    type: VehicleApprovalResponseDto
  })
  async approveVehicle(
    @Param('userId') userId: string,
    @Body() approvalData: ApproveVehicleDto,
    @Req() req: any,
  ) {
    return this.approveVehicleUseCase.execute(userId, approvalData, req.user.id);
  }

  @Get('status/:userId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get vehicle approval status' })
  @ApiParam({ name: 'userId', description: 'User ID of the vehicle owner' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehicle approval status retrieved successfully',
    type: VehicleApprovalResponseDto
  })
  async getVehicleApprovalStatus(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    // Users can only check their own status, admins can check any
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      if (req.user.id !== userId) {
        throw new Error('Unauthorized to check this vehicle status');
      }
    }

    return this.getPendingVehiclesUseCase.execute({ 
      status: undefined, // Get all statuses for specific user
      page: 1, 
      limit: 1 
    });
  }

  @Put(':userId/documents/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify or reject vehicle document' })
  @ApiParam({ name: 'userId', description: 'User ID of the vehicle owner' })
  @ApiResponse({ 
    status: 200, 
    description: 'Document verification status updated successfully',
    type: DocumentVerificationResultDto
  })
  async verifyDocument(
    @Param('userId') userId: string,
    @Body() verificationData: VerifyDocumentDto & { documentType: string },
    @Req() req: any,
  ) {
    return this.verifyVehicleDocumentUseCase.execute(
      userId, 
      verificationData.documentType, 
      verificationData, 
      req.user.id
    );
  }

  @Get(':vehicleId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get single vehicle with full details including user information' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vehicle details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        vehicleType: { type: 'string', enum: ['motorcycle', 'tricycle', 'car', 'mini_truck', 'truck', 'specialized_recycling'] },
        maxLoadWeight: { type: 'number' },
        maxLoadVolume: { type: 'number', nullable: true },
        materialCompatibility: { type: 'array', items: { type: 'string' } },
        plateNumber: { type: 'string' },
        vehicleColor: { type: 'string' },
        registrationExpiryDate: { type: 'string' },
        insuranceExpiryDate: { type: 'string', nullable: true },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              status: { type: 'string' },
              uploadedAt: { type: 'string' },
              verifiedAt: { type: 'string', nullable: true },
              verifiedBy: { type: 'string', nullable: true },
              rejectionReason: { type: 'string', nullable: true }
            }
          }
        },
        fuelType: { type: 'string', enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
        status: { type: 'string' },
        isActive: { type: 'boolean' },
        isUnderMaintenance: { type: 'boolean' },
        isEnterpriseEligible: { type: 'boolean' },
        approvedAt: { type: 'string', nullable: true },
        approvedBy: { type: 'string', nullable: true },
        rejectionReason: { type: 'string', nullable: true },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            profilePhoto: { type: 'string', nullable: true },
            location: {
              type: 'object',
              nullable: true,
              properties: {
                type: { type: 'string', enum: ['Point'] },
                coordinates: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                address: { type: 'string', nullable: true },
                city: { type: 'string', nullable: true },
                state: { type: 'string', nullable: true },
                country: { type: 'string', nullable: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleWithUser(@Param('vehicleId') vehicleId: string) {
    return this.getVehicleWithUserUseCase.execute(vehicleId);
  }
}
