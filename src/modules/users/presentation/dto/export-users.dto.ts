import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserType } from '../../domain/types/user.types';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf'
}

export class ExportUsersDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ required: false, description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Filter by zone' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiProperty({ required: false, enum: UserStatus, description: 'Filter by user status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ required: false, enum: UserType, description: 'Filter by user type' })
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @ApiProperty({ required: false, description: 'Date range for export' })
  @IsOptional()
  @IsString()
  dateRange?: string;
}
