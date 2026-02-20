import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityAction, RiskLevel, ActivitySource, ActivityOutcome } from '../../infrastructure/persistence/activity-log.model';

export class ActivityFilterDto {
  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, enum: ActivityAction, description: 'Filter by action type' })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiProperty({ required: false, enum: RiskLevel, description: 'Filter by risk level' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiProperty({ required: false, enum: ActivitySource, description: 'Filter by source' })
  @IsOptional()
  @IsEnum(ActivitySource)
  source?: ActivitySource;

  @ApiProperty({ required: false, enum: ActivityOutcome, description: 'Filter by outcome' })
  @IsOptional()
  @IsEnum(ActivityOutcome)
  outcome?: ActivityOutcome;

  @ApiProperty({ required: false, description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false, description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ required: false, description: 'Filter by start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: 'Filter by end date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
