import { IsBoolean, IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;
}

export class DayScheduleDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ type: [TimeSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}

export class WeeklyScheduleDto {
  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday: DayScheduleDto;

  @ApiProperty({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday: DayScheduleDto;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiProperty({ type: WeeklyScheduleDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WeeklyScheduleDto)
  weeklySchedule?: WeeklyScheduleDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  availableForEnterpriseJobs?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoGoOnlineDuringSchedule?: boolean;
}

export class UpdateOnlineStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isOnline: boolean;
}

export class AvailabilityInsightsDto {
  @ApiProperty()
  avgWeeklyEarnings: number;

  @ApiProperty()
  peakHoursStart: string;

  @ApiProperty()
  peakHoursEnd: string;

  @ApiProperty()
  totalHoursPerWeek: number;

  @ApiProperty()
  lastUpdated: string;
}

export class AgentAvailabilityResponseDto {
  @ApiProperty()
  isOnline: boolean;

  @ApiProperty({ type: WeeklyScheduleDto })
  weeklySchedule: WeeklyScheduleDto;

  @ApiProperty()
  availableForEnterpriseJobs: boolean;

  @ApiProperty()
  autoGoOnlineDuringSchedule: boolean;

  @ApiProperty({ type: AvailabilityInsightsDto })
  insights: AvailabilityInsightsDto;

  @ApiProperty()
  updatedAt: string;
}
