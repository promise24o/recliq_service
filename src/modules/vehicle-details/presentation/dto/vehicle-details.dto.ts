import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, FuelType, DocumentType, MaterialType, VehicleStatus, DocumentStatus } from '../../domain/constants/vehicle.constants';

export class VehicleDocumentDto {
  @ApiProperty({ example: 'registration' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://example.com/doc.pdf' })
  @IsString()
  documentUrl: string;
}

export class CreateVehicleDetailsDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.MINI_TRUCK })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 750, minimum: 1 })
  @IsNumber()
  maxLoadWeight: number;

  @ApiProperty({ example: 1000, required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  maxLoadVolume?: number;

  @ApiProperty({ enum: MaterialType, isArray: true, example: [MaterialType.PET, MaterialType.METALS, MaterialType.MIXED] })
  @IsArray()
  @IsEnum(MaterialType, { each: true })
  materialCompatibility: MaterialType[];

  @ApiProperty({ example: 'PHC-204-JK' })
  @IsString()
  plateNumber: string;

  @ApiProperty({ example: 'Blue' })
  @IsString()
  vehicleColor: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  registrationExpiryDate: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiProperty({ enum: FuelType, example: FuelType.DIESEL })
  @IsEnum(FuelType)
  fuelType: FuelType;
}

export class UpdateVehicleDetailsDto {
  @ApiProperty({ enum: VehicleType, required: false, example: VehicleType.MINI_TRUCK })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiProperty({ example: 750, required: false, minimum: 1 })
  @IsOptional()
  @IsNumber()
  maxLoadWeight?: number;

  @ApiProperty({ example: 1000, required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  maxLoadVolume?: number;

  @ApiProperty({ enum: MaterialType, isArray: true, required: false, example: [MaterialType.PET, MaterialType.METALS, MaterialType.MIXED] })
  @IsOptional()
  @IsArray()
  @IsEnum(MaterialType, { each: true })
  materialCompatibility?: MaterialType[];

  @ApiProperty({ example: 'PHC-204-JK', required: false })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiProperty({ example: 'Blue', required: false })
  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  registrationExpiryDate?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiProperty({ enum: FuelType, required: false, example: FuelType.DIESEL })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isUnderMaintenance?: boolean;
}

export class UploadVehicleDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.REGISTRATION })
  @IsEnum(DocumentType)
  documentType: DocumentType;
}

export class VehicleDocumentResponseDto {
  @ApiProperty()
  documentType: string;

  @ApiProperty()
  documentUrl: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  uploadedAt: string;

  @ApiProperty({ required: false })
  verifiedAt?: string;

  @ApiProperty({ required: false })
  rejectionReason?: string;
}

export class VehicleDetailsResponseDto {
  @ApiProperty()
  vehicleType: string;

  @ApiProperty()
  maxLoadWeight: number;

  @ApiProperty({ required: false })
  maxLoadVolume?: number;

  @ApiProperty()
  materialCompatibility: string[];

  @ApiProperty()
  plateNumber: string;

  @ApiProperty()
  vehicleColor: string;

  @ApiProperty()
  registrationExpiryDate: string;

  @ApiProperty({ required: false })
  insuranceExpiryDate?: string;

  @ApiProperty({ type: [VehicleDocumentResponseDto] })
  documents: VehicleDocumentResponseDto[];

  @ApiProperty()
  fuelType: string;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isUnderMaintenance: boolean;

  @ApiProperty()
  isEnterpriseEligible: boolean;

  @ApiProperty()
  updatedAt: string;
}

export class UpdateVehicleStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsBoolean()
  isUnderMaintenance: boolean;
}
