import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, FuelType, DocumentType, MaterialType, DocumentStatus } from '../../domain/constants/vehicle.constants';

export class VehicleTypesResponseDto {
  @ApiProperty({ 
    enum: VehicleType,
    description: 'Available vehicle types',
    example: [VehicleType.MOTORCYCLE, VehicleType.TRICYCLE, VehicleType.CAR, VehicleType.MINI_TRUCK, VehicleType.TRUCK, VehicleType.SPECIALIZED_RECYCLING]
  })
  vehicleTypes: VehicleType[];
}

export class FuelTypesResponseDto {
  @ApiProperty({ 
    enum: FuelType,
    description: 'Available fuel types',
    example: [FuelType.PETROL, FuelType.DIESEL, FuelType.ELECTRIC, FuelType.HYBRID]
  })
  fuelTypes: FuelType[];
}

export class DocumentTypesResponseDto {
  @ApiProperty({ 
    enum: DocumentType,
    description: 'Available document types',
    example: [DocumentType.REGISTRATION, DocumentType.INSURANCE, DocumentType.ROADWORTHINESS, DocumentType.INSPECTION_CERTIFICATE]
  })
  documentTypes: DocumentType[];
}

export class MaterialTypesResponseDto {
  @ApiProperty({ 
    enum: MaterialType,
    description: 'Available material types',
    example: [MaterialType.PET, MaterialType.METALS, MaterialType.MIXED, MaterialType.E_WASTE, MaterialType.ORGANIC]
  })
  materialTypes: MaterialType[];
}

export class DocumentStatusesResponseDto {
  @ApiProperty({ 
    enum: DocumentStatus,
    description: 'Document verification statuses',
    example: [DocumentStatus.PENDING, DocumentStatus.VERIFIED, DocumentStatus.REJECTED]
  })
  documentStatuses: DocumentStatus[];
}

export class VehicleCapacityLimitsResponseDto {
  @ApiProperty({ description: 'Vehicle capacity limits by type' })
  capacityLimits: {
    [key in VehicleType]: {
      min: number;
      max: number;
    };
  };
}

export class AllVehicleEnumsResponseDto {
  @ApiProperty({ type: VehicleTypesResponseDto })
  vehicleTypes: VehicleTypesResponseDto;

  @ApiProperty({ type: FuelTypesResponseDto })
  fuelTypes: FuelTypesResponseDto;

  @ApiProperty({ type: DocumentTypesResponseDto })
  documentTypes: DocumentTypesResponseDto;

  @ApiProperty({ type: MaterialTypesResponseDto })
  materialTypes: MaterialTypesResponseDto;

  @ApiProperty({ type: DocumentStatusesResponseDto })
  documentStatuses: DocumentStatusesResponseDto;

  @ApiProperty({ type: VehicleCapacityLimitsResponseDto })
  capacityLimits: VehicleCapacityLimitsResponseDto;
}
