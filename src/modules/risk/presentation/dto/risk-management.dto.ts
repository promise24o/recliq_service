import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsObject, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { 
  RiskState, 
  RiskEventType, 
  KYCStatus,
  RiskUser,
  RiskSummary,
  RiskEvent,
  ActivityContext
} from '../../domain/types/risk.types';

// Query DTOs
export class GetRiskUsersQueryDto {
  @ApiProperty({ description: 'Page number', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, example: 25 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 25;

  @ApiProperty({ description: 'Search by name, phone, or user ID', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by risk state', required: false, enum: RiskState })
  @IsOptional()
  @IsEnum(RiskState)
  riskState?: RiskState;

  @ApiProperty({ description: 'Filter by reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Sort by field', required: false, enum: ['name', 'since', 'lastActivity', 'riskState'] })
  @IsOptional()
  @IsEnum(['name', 'since', 'lastActivity', 'riskState'])
  sortBy?: 'name' | 'since' | 'lastActivity' | 'riskState' = 'since';

  @ApiProperty({ description: 'Sort order', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Request DTOs
export class CreateRiskEventDto {
  @ApiProperty({ description: 'User ID', required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Risk event type', required: true, enum: RiskEventType })
  @IsEnum(RiskEventType)
  type: RiskEventType;

  @ApiProperty({ description: 'Reason for risk event', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Duration in days (for suspensions)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  duration?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RiskActionDto {
  @ApiProperty({ description: 'Action to perform', required: true, enum: ['flag', 'suspend', 'reinstate', 'extend_suspension', 'ban'] })
  @IsEnum(['flag', 'suspend', 'reinstate', 'extend_suspension', 'ban'])
  action: 'flag' | 'suspend' | 'reinstate' | 'extend_suspension' | 'ban';

  @ApiProperty({ description: 'Reason for action', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Duration in days (for suspension/extension)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  duration?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Simple request DTOs for specific actions
export class FlagUserDto {
  @ApiProperty({ description: 'Reason for flagging', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Duration in days', required: true })
  @IsNumber()
  @Min(1)
  @Max(365)
  duration: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BanUserDto {
  @ApiProperty({ description: 'Reason for ban', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ReinstateUserDto {
  @ApiProperty({ description: 'Reason for reinstatement', required: true })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Response DTOs
export class RiskEventDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Event type', enum: RiskEventType })
  type: RiskEventType;

  @ApiProperty({ description: 'Reason for event' })
  reason: string;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Actor who performed the action' })
  actor: string;

  @ApiProperty({ description: 'Actor ID' })
  actorId: string;

  @ApiProperty({ description: 'Expiration date (if applicable)' })
  expires?: Date;

  @ApiProperty({ description: 'Whether the event is resolved' })
  resolved?: boolean;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class ActivityContextDto {
  @ApiProperty({ description: 'Number of disputes' })
  disputes: number;

  @ApiProperty({ description: 'Number of cancellations' })
  cancellations: number;

  @ApiProperty({ description: 'Whether wallet anomalies exist' })
  walletAnomalies: boolean;

  @ApiProperty({ description: 'Pickup history' })
  pickupHistory: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
  };
}

export class RiskUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User phone' })
  phone: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User city' })
  city: string;

  @ApiProperty({ description: 'User zone' })
  zone: string;

  @ApiProperty({ description: 'Current risk state', enum: RiskState })
  riskState: RiskState;

  @ApiProperty({ description: 'Reason for current risk state' })
  reason: string;

  @ApiProperty({ description: 'When the current risk state started' })
  since: Date;

  @ApiProperty({ description: 'When the current risk state expires' })
  expires?: Date;

  @ApiProperty({ description: 'Who flagged the user' })
  flaggedBy: string;

  @ApiProperty({ description: 'ID of who flagged the user' })
  flaggedById: string;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date;

  @ApiProperty({ description: 'Account age' })
  accountAge: string;

  @ApiProperty({ description: 'KYC status', enum: KYCStatus })
  kycStatus: KYCStatus;

  @ApiProperty({ description: 'Risk timeline', type: [RiskEventDto] })
  riskTimeline: RiskEventDto[];

  @ApiProperty({ description: 'Activity context', type: ActivityContextDto })
  activityContext: ActivityContextDto;

  @ApiProperty({ description: 'User details' })
  userDetails: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    type: string;
    role: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    isVerified: boolean;
    profilePhoto?: string;
    totalRecycles: number;
    lastActivity: Date;
    created: Date;
  };
}

export class RiskUsersResponseDto {
  @ApiProperty({ description: 'Array of risk users', type: [RiskUserDto] })
  data: RiskUserDto[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}




export class RiskSummaryDto {
  @ApiProperty({ description: 'Number of permanently banned users' })
  permanentlyBanned: number;

  @ApiProperty({ description: 'Number of temporarily suspended users' })
  temporarilySuspended: number;

  @ApiProperty({ description: 'Number of flagged users' })
  flaggedUsers: number;

  @ApiProperty({ description: 'Number of users on compliance hold' })
  complianceHolds: number;

  @ApiProperty({ description: 'Number of users under review' })
  usersUnderReview: number;

  @ApiProperty({ description: 'Number of users reinstated in last 30 days' })
  reinstated30d: number;
}
