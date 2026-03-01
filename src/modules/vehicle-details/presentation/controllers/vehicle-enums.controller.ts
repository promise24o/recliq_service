import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { VehicleType, FuelType, DocumentType, MaterialType, DocumentStatus, VEHICLE_CAPACITY_LIMITS } from '../../domain/constants/vehicle.constants';
import { 
  VehicleTypesResponseDto, 
  FuelTypesResponseDto, 
  DocumentTypesResponseDto, 
  MaterialTypesResponseDto, 
  DocumentStatusesResponseDto,
  VehicleCapacityLimitsResponseDto,
  AllVehicleEnumsResponseDto
} from '../dto/vehicle-enums.dto';

@ApiTags('Vehicle Details Enums')
@Controller('vehicle-details/enums')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehicleEnumsController {

  @Get('vehicle-types')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get available vehicle types' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle types retrieved successfully',
    type: VehicleTypesResponseDto,
  })
  getVehicleTypes(): VehicleTypesResponseDto {
    return {
      vehicleTypes: Object.values(VehicleType)
    };
  }

  @Get('fuel-types')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get available fuel types' })
  @ApiResponse({
    status: 200,
    description: 'Fuel types retrieved successfully',
    type: FuelTypesResponseDto,
  })
  getFuelTypes(): FuelTypesResponseDto {
    return {
      fuelTypes: Object.values(FuelType)
    };
  }

  @Get('document-types')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get available document types' })
  @ApiResponse({
    status: 200,
    description: 'Document types retrieved successfully',
    type: DocumentTypesResponseDto,
  })
  getDocumentTypes(): DocumentTypesResponseDto {
    return {
      documentTypes: Object.values(DocumentType)
    };
  }

  @Get('material-types')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get available material types' })
  @ApiResponse({
    status: 200,
    description: 'Material types retrieved successfully',
    type: MaterialTypesResponseDto,
  })
  getMaterialTypes(): MaterialTypesResponseDto {
    return {
      materialTypes: Object.values(MaterialType)
    };
  }

  @Get('document-statuses')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get document verification statuses' })
  @ApiResponse({
    status: 200,
    description: 'Document statuses retrieved successfully',
    type: DocumentStatusesResponseDto,
  })
  getDocumentStatuses(): DocumentStatusesResponseDto {
    return {
      documentStatuses: Object.values(DocumentStatus)
    };
  }

  @Get('capacity-limits')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get vehicle capacity limits by type' })
  @ApiResponse({
    status: 200,
    description: 'Capacity limits retrieved successfully',
    type: VehicleCapacityLimitsResponseDto,
  })
  getCapacityLimits(): VehicleCapacityLimitsResponseDto {
    return {
      capacityLimits: VEHICLE_CAPACITY_LIMITS
    };
  }

  @Get('all')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get all vehicle-related enums' })
  @ApiResponse({
    status: 200,
    description: 'All enums retrieved successfully',
    type: AllVehicleEnumsResponseDto,
  })
  getAllEnums(): AllVehicleEnumsResponseDto {
    return {
      vehicleTypes: this.getVehicleTypes(),
      fuelTypes: this.getFuelTypes(),
      documentTypes: this.getDocumentTypes(),
      materialTypes: this.getMaterialTypes(),
      documentStatuses: this.getDocumentStatuses(),
      capacityLimits: this.getCapacityLimits()
    };
  }
}
