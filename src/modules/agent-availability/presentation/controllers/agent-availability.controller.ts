import { Controller, Get, Put, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetAgentAvailabilityUseCase } from '../../application/use-cases/get-agent-availability.usecase';
import { UpdateAgentAvailabilityUseCase } from '../../application/use-cases/update-agent-availability.usecase';
import { UpdateOnlineStatusUseCase } from '../../application/use-cases/update-online-status.usecase';
import { UpdateAvailabilityDto, UpdateOnlineStatusDto, AgentAvailabilityResponseDto } from '../dto/agent-availability.dto';
import { UpdateAgentLocationDto } from '../dto/update-location.dto';
import { LocationTrackingService } from '../../../../shared/services/location-tracking.service';

@ApiTags('Agent Availability')
@Controller('agent-availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgentAvailabilityController {
  constructor(
    private readonly getAvailabilityUseCase: GetAgentAvailabilityUseCase,
    private readonly updateAvailabilityUseCase: UpdateAgentAvailabilityUseCase,
    private readonly updateOnlineStatusUseCase: UpdateOnlineStatusUseCase,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  @Get()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get agent availability schedule' })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule retrieved successfully',
    type: AgentAvailabilityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailability(@Request() req): Promise<AgentAvailabilityResponseDto> {
    return this.getAvailabilityUseCase.execute(req.user.id);
  }

  @Put()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update agent availability schedule' })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule updated successfully',
    type: AgentAvailabilityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAvailability(
    @Request() req,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<AgentAvailabilityResponseDto> {
    return this.updateAvailabilityUseCase.execute(req.user.id, dto);
  }

  @Patch('online-status')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update agent online status' })
  @ApiResponse({
    status: 200,
    description: 'Online status updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOnlineStatus(
    @Request() req,
    @Body() dto: UpdateOnlineStatusDto,
  ): Promise<{ isOnline: boolean }> {
    const result = await this.updateOnlineStatusUseCase.execute(req.user.id, dto.isOnline);

    // When agent goes offline, remove from Redis live tracking
    if (!dto.isOnline) {
      await this.locationTrackingService.removeAgentLocation(req.user.id);
    }

    return result;
  }

  @Post('location')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update agent live location (HTTP fallback when WebSocket unavailable)' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        timestamp: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLocation(
    @Request() req,
    @Body() dto: UpdateAgentLocationDto,
  ): Promise<{ success: boolean; timestamp: number }> {
    const success = await this.locationTrackingService.updateAgentLocation(
      req.user.id,
      dto.lat,
      dto.lng,
      dto.accuracy,
    );

    return { success, timestamp: Date.now() };
  }
}
