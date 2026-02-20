import { IsOptional, IsString, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SecuritySignalType, SecuritySignalSeverity } from '../../infrastructure/persistence/security-signal.model';
import { Transform } from 'class-transformer';

export class SecuritySignalFilterDto {
  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, enum: SecuritySignalType, description: 'Filter by signal type' })
  @IsOptional()
  @IsEnum(SecuritySignalType)
  type?: SecuritySignalType;

  @ApiProperty({ required: false, enum: SecuritySignalSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(SecuritySignalSeverity)
  severity?: SecuritySignalSeverity;

  @ApiProperty({ required: false, description: 'Filter by acknowledgement status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  acknowledged?: boolean;

  @ApiProperty({ required: false, description: 'Filter by start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: 'Filter by end date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
