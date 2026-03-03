import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { CreatePickupRequestUseCase } from '../../application/use-cases/create-pickup-request.usecase';
import { GetPickupRequestsUseCase } from '../../application/use-cases/get-pickup-requests.usecase';
import { GetPickupRequestUseCase } from '../../application/use-cases/get-pickup-request.usecase';
import { UpdatePickupStatusUseCase } from '../../application/use-cases/update-pickup-status.usecase';
import { AssignAgentUseCase } from '../../application/use-cases/assign-agent.usecase';
import { CancelPickupRequestUseCase } from '../../application/use-cases/cancel-pickup-request.usecase';
import { ConvertPickupModeUseCase } from '../../application/use-cases/convert-pickup-mode.usecase';
import { EscalatePickupRequestUseCase } from '../../application/use-cases/escalate-pickup-request.usecase';
import { RetriggerMatchingUseCase } from '../../application/use-cases/retrigger-matching.usecase';
import { GetPickupSummaryUseCase } from '../../application/use-cases/get-pickup-summary.usecase';
import { GetPickupFunnelUseCase } from '../../application/use-cases/get-pickup-funnel.usecase';
import { GetFailureAnalysisUseCase } from '../../application/use-cases/get-failure-analysis.usecase';
import { GetAvailableAgentsUseCase } from '../../application/use-cases/get-available-agents.usecase';
import { AgentRespondToPickupUseCase } from '../../application/use-cases/agent-respond-pickup.usecase';
import { CreatePickupRequestDto } from '../dto/create-pickup-request.dto';
import { UpdatePickupStatusDto } from '../dto/update-pickup-status.dto';
import { AssignAgentDto } from '../dto/assign-agent.dto';
import { CancelPickupRequestDto } from '../dto/cancel-pickup-request.dto';
import { EscalatePickupRequestDto } from '../dto/escalate-pickup-request.dto';
import { AgentRespondToPickupDto } from '../dto/agent-respond-pickup.dto';
import { LocationTrackingService } from '../../../../shared/services/location-tracking.service';
import { ZoneValidationService } from '../../application/services/zone-validation.service';
import { AgentAvailabilityService } from '../../application/services/agent-availability.service';
import { PickupGateway } from '../gateways/pickup.gateway';

@ApiTags('pickup')
@Controller('pickup')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PickupController {
  constructor(
    private readonly createPickupRequestUseCase: CreatePickupRequestUseCase,
    private readonly getPickupRequestsUseCase: GetPickupRequestsUseCase,
    private readonly getPickupRequestUseCase: GetPickupRequestUseCase,
    private readonly updatePickupStatusUseCase: UpdatePickupStatusUseCase,
    private readonly assignAgentUseCase: AssignAgentUseCase,
    private readonly cancelPickupRequestUseCase: CancelPickupRequestUseCase,
    private readonly convertPickupModeUseCase: ConvertPickupModeUseCase,
    private readonly escalatePickupRequestUseCase: EscalatePickupRequestUseCase,
    private readonly retriggerMatchingUseCase: RetriggerMatchingUseCase,
    private readonly getPickupSummaryUseCase: GetPickupSummaryUseCase,
    private readonly getPickupFunnelUseCase: GetPickupFunnelUseCase,
    private readonly getFailureAnalysisUseCase: GetFailureAnalysisUseCase,
    private readonly getAvailableAgentsUseCase: GetAvailableAgentsUseCase,
    private readonly agentRespondToPickupUseCase: AgentRespondToPickupUseCase,
    private readonly locationTrackingService: LocationTrackingService,
    private readonly zoneValidationService: ZoneValidationService,
    private readonly agentAvailabilityService: AgentAvailabilityService,
    private readonly pickupGateway: PickupGateway,
  ) {}

  // --- User Endpoints ---

  @Post()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create a new pickup request' })
  @ApiResponse({
    status: 201,
    description: 'Pickup request created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: 'USR001' },
        userName: { type: 'string', example: 'John Smith' },
        city: { type: 'string', example: 'Lagos' },
        zone: { type: 'string', example: 'Ikoyi' },
        pickupMode: { type: 'string', example: 'pickup' },
        matchType: { type: 'string', example: 'auto' },
        wasteType: { type: 'string', example: 'plastic' },
        estimatedWeight: { type: 'number', example: 5.2 },
        status: { type: 'string', example: 'matching' },
        slaDeadline: { type: 'string', example: '2024-01-15T11:30:00.000Z' },
        pricing: {
          type: 'object',
          properties: {
            baseAmount: { type: 'number', example: 52 },
            bonusAmount: { type: 'number', example: 5 },
            totalAmount: { type: 'number', example: 57 },
            currency: { type: 'string', example: 'NGN' },
          },
        },
        address: { type: 'string', example: '123 Awolowo Road, Ikoyi' },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPickupRequest(@Body() dto: CreatePickupRequestDto, @Request() req) {
    // Extract phone number as string (handle Phone object if present)
    const userPhone = req.user?.phone?.value || 
                     req.user?.phone || 
                     req.user?.phoneNumber?.value || 
                     req.user?.phoneNumber || 
                     '';

    return this.createPickupRequestUseCase.execute(
      dto,
      req.user.id,
      req.user.name || req.user.fullName || 'Unknown',
      userPhone,
    );
  }

  @Get('my-requests')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get current user pickup requests' })
  @ApiResponse({ status: 200, description: 'User pickup requests retrieved successfully' })
  async getMyRequests(@Request() req) {
    return this.getPickupRequestsUseCase.findByUserId(req.user.id);
  }

  @Get('available-agents')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get available agents for manual selection based on user location' })
  @ApiQuery({ name: 'lat', required: true, description: 'User latitude', type: Number })
  @ApiQuery({ name: 'lng', required: true, description: 'User longitude', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Available agents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        serviceable: { type: 'boolean', example: true, description: 'Whether the location is serviceable' },
        city: { type: 'string', example: 'Lagos' },
        zone: { type: 'string', example: 'Ikoyi' },
        agents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string', example: 'AGT001' },
              agentName: { type: 'string', example: 'Samuel Kamau' },
              currentLocation: {
                type: 'object',
                properties: {
                  lat: { type: 'number', example: 6.4530 },
                  lng: { type: 'number', example: 3.4160 },
                },
              },
              distance: { type: 'number', example: 0.85, description: 'Distance in kilometers' },
              estimatedArrivalTime: { type: 'number', example: 12, description: 'ETA in minutes' },
              rating: { type: 'number', example: 4.8 },
              vehicleType: { type: 'string', example: 'Motorcycle' },
            },
          },
        },
        message: { type: 'string', example: 'No agents available in your area at the moment' },
      },
    },
  })
  async getAvailableAgents(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.getAvailableAgentsUseCase.execute({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });
  }

  @Get('debug/location-check')
  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Debug endpoint to check zone, agents, and live locations' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude', type: Number })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude', type: Number })
  async debugLocationCheck(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // 1. Validate zone for the location
    const zoneValidation = await this.zoneValidationService.validateLocation({
      lat: userLat,
      lng: userLng,
    });

    // 2. Get all live locations from Redis
    const allLiveLocations = await this.locationTrackingService.getAllLiveLocations();

    // 3. Get detailed agent info if zone is valid
    let agentDebugList: any[] = [];
    if (zoneValidation.zoneId) {
      const debugResult = await this.agentAvailabilityService.getDebugInfo(
        { lat: userLat, lng: userLng },
        zoneValidation.zoneId,
      );
      agentDebugList = debugResult.agentsInZone;
    }

    // 4. Get available agents result
    const availableAgentsResult = await this.getAvailableAgentsUseCase.execute({
      lat: userLat,
      lng: userLng,
    });

    return {
      userLocation: { lat: userLat, lng: userLng },
      zoneInfo: {
        zoneId: zoneValidation.zoneId,
        city: zoneValidation.city,
        zone: zoneValidation.zone,
        serviceable: zoneValidation.serviceable,
        zonesFound: zoneValidation.zonesFound,
      },
      agentDebugInfo: agentDebugList,
      availableAgents: availableAgentsResult.agents,
      allLiveLocationsInRedis: allLiveLocations,
      liveLocationCount: allLiveLocations.length,
      message: availableAgentsResult.message,
    };
  }

  // --- Agent Endpoints ---

  @Get('agent/requests')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get pickup requests assigned to the current agent' })
  @ApiResponse({ status: 200, description: 'Agent pickup requests retrieved successfully' })
  async getAgentRequests(@Request() req) {
    return this.getPickupRequestsUseCase.findByAgentId(req.user.id);
  }

  @Get('agent/pending')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get pending pickup requests awaiting agent acceptance' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pending pickup requests retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userName: { type: 'string' },
          userPhone: { type: 'string' },
          pickupMode: { type: 'string' },
          wasteType: { type: 'string' },
          estimatedWeight: { type: 'number' },
          address: { type: 'string' },
          status: { type: 'string', example: 'pending_acceptance' },
        },
      },
    },
  })
  async getAgentPendingRequests(@Request() req) {
    const requests = await this.getPickupRequestsUseCase.findByAgentId(req.user.id);
    return requests.filter(r => r.status === 'pending_acceptance');
  }

  @Get('agent/connection-status')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Check agent WebSocket connection status and get pending requests' })
  @ApiResponse({
    status: 200,
    description: 'Connection status and pending requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isConnected: { type: 'boolean', example: true },
        socketId: { type: 'string', example: 'ABC123' },
        connectedAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        pendingRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userName: { type: 'string' },
              pickupMode: { type: 'string' },
              wasteType: { type: 'string' },
              estimatedWeight: { type: 'number' },
              address: { type: 'string' },
              pricing: {
                type: 'object',
                properties: {
                  totalAmount: { type: 'number' },
                  currency: { type: 'string' },
                },
              },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getAgentConnectionStatus(@Request() req) {
    const agentId = req.user.id;
    
    // Get pending requests
    const allRequests = await this.getPickupRequestsUseCase.findByAgentId(agentId);
    const pendingRequests = allRequests.filter(r => r.status === 'pending_acceptance');
    
    // Check WebSocket connection status - safer approach
    let isConnected = false;
    let socketInfo: { socketId: string; connectedAt: string } | null = null;
    
    try {
      const agentSockets = this.pickupGateway['server']?.sockets?.sockets;
      if (agentSockets) {
        for (const [socketId, socket] of agentSockets) {
          if ((socket as any).userId === agentId && (socket as any).userRole === 'agent') {
            isConnected = true;
            socketInfo = {
              socketId,
              connectedAt: new Date().toISOString(),
            };
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking WebSocket connection:', error.message);
    }
    
    return {
      isConnected,
      socketInfo,
      pendingRequests: pendingRequests.map(req => ({
        id: req.id,
        userName: req.userName,
        userPhone: req.userPhone,
        pickupMode: req.pickupMode,
        wasteType: req.wasteType,
        estimatedWeight: req.estimatedWeight,
        address: req.address,
        coordinates: req.coordinates,
        pricing: req.pricing,
        createdAt: req.createdAt,
        slaDeadline: req.slaDeadline,
      })),
    };
  }

  @Patch(':id/respond')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Accept or decline a pickup request' })
  @ApiResponse({
    status: 200,
    description: 'Response recorded successfully',
    schema: {
      type: 'object',
      properties: {
        pickup: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'assigned' },
          },
        },
        trackingEnabled: { type: 'boolean', example: true },
        trackableUserId: { type: 'string', description: 'User ID whose location can be tracked' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid response or pickup not in pending_acceptance status' })
  @ApiResponse({ status: 403, description: 'Not assigned to this pickup' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async respondToPickup(
    @Param('id') id: string,
    @Body() dto: AgentRespondToPickupDto,
    @Request() req,
  ) {
    return this.agentRespondToPickupUseCase.execute(
      id,
      req.user.id,
      req.user.name || req.user.fullName || 'Agent',
      dto.response,
      dto.reason,
      dto.estimatedArrivalMinutes,
    );
  }

  @Get(':id/track-location')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get live location for tracking during pickup. User tracks agent for pickup mode, agent tracks user for dropoff mode.' })
  @ApiResponse({
    status: 200,
    description: 'Live location retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        trackableUserId: { type: 'string', example: 'USR001' },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 6.4530 },
            lng: { type: 'number', example: 3.4160 },
          },
        },
        lastUpdated: { type: 'string', example: '2024-01-15T10:35:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Tracking not available for current pickup status' })
  @ApiResponse({ status: 403, description: 'Not authorized to track this pickup' })
  @ApiResponse({ status: 404, description: 'Pickup request not found or location not available' })
  async trackLocation(
    @Param('id') id: string,
    @Request() req,
  ) {
    const pickup = await this.getPickupRequestUseCase.execute(id);
    
    // Verify user is part of this pickup
    const isUser = pickup.userId === req.user.id;
    const isAgent = pickup.assignedAgentId === req.user.id;
    
    if (!isUser && !isAgent) {
      throw new Error('Not authorized to track this pickup');
    }

    // Tracking only available when agent has accepted
    if (!['assigned', 'agent_en_route', 'arrived'].includes(pickup.status)) {
      throw new Error('Tracking is only available after agent accepts the pickup');
    }

    // Determine who to track based on requester role
    // User tracks agent, Agent tracks user
    let trackableUserId: string;
    
    if (isUser) {
      // User tracks agent location
      trackableUserId = pickup.assignedAgentId!;
    } else {
      // Agent tracks user location
      trackableUserId = pickup.userId;
    }

    // Get live location from Redis
    const location = await this.locationTrackingService.getAgentLocation(trackableUserId);
    
    if (!location) {
      return {
        trackableUserId,
        location: null,
        message: 'Location not available. The user may not have shared their location yet.',
      };
    }

    return {
      trackableUserId,
      location: {
        lat: location.latitude,
        lng: location.longitude,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update pickup request status' })
  @ApiResponse({
    status: 200,
    description: 'Pickup status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'agent_en_route' },
        updatedAt: { type: 'string', example: '2024-01-15T10:35:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePickupStatusDto,
    @Request() req,
  ) {
    return this.updatePickupStatusUseCase.execute(
      id,
      dto.status as any,
      req.user.id,
      req.user.name || req.user.fullName,
    );
  }

  // --- Admin Endpoints ---

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all pickup requests with filters and pagination' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'zone', required: false, description: 'Filter by zone' })
  @ApiQuery({ name: 'pickupMode', required: false, enum: ['pickup', 'dropoff'], description: 'Filter by pickup mode' })
  @ApiQuery({ name: 'matchType', required: false, enum: ['auto', 'user_selected'], description: 'Filter by match type' })
  @ApiQuery({ name: 'wasteType', required: false, enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'e_waste', 'mixed'], description: 'Filter by waste type' })
  @ApiQuery({ name: 'status', required: false, enum: ['new', 'matching', 'assigned', 'agent_en_route', 'arrived', 'completed', 'cancelled', 'failed'], description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by user name or phone' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'yesterday', 'week', 'month'], description: 'Filter by time range' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 25)' })
  @ApiResponse({ status: 200, description: 'Pickup requests retrieved successfully' })
  async getPickupRequests(
    @Query('city') city?: string,
    @Query('zone') zone?: string,
    @Query('pickupMode') pickupMode?: string,
    @Query('matchType') matchType?: string,
    @Query('wasteType') wasteType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('timeRange') timeRange?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getPickupRequestsUseCase.execute({
      city,
      zone,
      pickupMode: pickupMode as any,
      matchType: matchType as any,
      wasteType: wasteType as any,
      status: status as any,
      search,
      timeRange: timeRange as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 25,
    });
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pickup request summary statistics' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'yesterday', 'week', 'month'] })
  @ApiResponse({
    status: 200,
    description: 'Pickup summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        newRequests: { type: 'number', example: 12 },
        matchingInProgress: { type: 'number', example: 8 },
        assignedPickups: { type: 'number', example: 23 },
        dropoffRequests: { type: 'number', example: 15 },
        atRiskSLA: { type: 'number', example: 4 },
        failedRequests: { type: 'number', example: 2 },
        completedToday: { type: 'number', example: 45 },
      },
    },
  })
  async getPickupSummary(
    @Query('city') city?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.getPickupSummaryUseCase.execute({ city, timeRange });
  }

  @Get('funnel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pickup request funnel data' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'yesterday', 'week', 'month'] })
  @ApiResponse({
    status: 200,
    description: 'Funnel data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stage: { type: 'string', example: 'Request Created' },
          count: { type: 'number', example: 100 },
          percentage: { type: 'number', example: 100 },
          breakdown: {
            type: 'object',
            properties: {
              pickup: { type: 'number', example: 65 },
              dropoff: { type: 'number', example: 35 },
              auto: { type: 'number', example: 70 },
              userSelected: { type: 'number', example: 30 },
            },
          },
        },
      },
    },
  })
  async getPickupFunnel(
    @Query('city') city?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.getPickupFunnelUseCase.execute({ city, timeRange });
  }

  @Get('failure-analysis')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get failure and delay analysis data' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['today', 'yesterday', 'week', 'month'] })
  @ApiResponse({
    status: 200,
    description: 'Failure analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalFailures: { type: 'number', example: 15 },
        failureReasons: {
          type: 'object',
          properties: {
            noAvailableAgent: { type: 'number', example: 8 },
            agentRejection: { type: 'number', example: 4 },
            timeout: { type: 'number', example: 2 },
            userCancellation: { type: 'number', example: 1 },
          },
        },
        delayCauses: {
          type: 'object',
          properties: {
            supplyShortage: { type: 'number', example: 12 },
            distance: { type: 'number', example: 8 },
            peakHourCongestion: { type: 'number', example: 6 },
            agentFlakiness: { type: 'number', example: 3 },
          },
        },
        cityBreakdown: {
          type: 'object',
          example: {
            Lagos: { failures: 8, delays: 15, totalRequests: 120 },
          },
        },
      },
    },
  })
  async getFailureAnalysis(
    @Query('city') city?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.getFailureAnalysisUseCase.execute({ city, timeRange });
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single pickup request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Pickup request retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: 'USR001' },
        userName: { type: 'string', example: 'John Smith' },
        userPhone: { type: 'string', example: '+2348012345678' },
        city: { type: 'string', example: 'Lagos' },
        zone: { type: 'string', example: 'Ikoyi' },
        pickupMode: { type: 'string', example: 'pickup' },
        matchType: { type: 'string', example: 'auto' },
        wasteType: { type: 'string', example: 'plastic' },
        estimatedWeight: { type: 'number', example: 5.2 },
        status: { type: 'string', example: 'assigned' },
        assignedAgentId: { type: 'string', example: 'AGT001' },
        assignedAgentName: { type: 'string', example: 'Samuel Kamau' },
        slaDeadline: { type: 'string', example: '2024-01-15T11:30:00.000Z' },
        pricing: {
          type: 'object',
          properties: {
            baseAmount: { type: 'number', example: 52 },
            bonusAmount: { type: 'number', example: 5 },
            totalAmount: { type: 'number', example: 57 },
            currency: { type: 'string', example: 'NGN' },
          },
        },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 6.4524 },
            lng: { type: 'number', example: 3.4158 },
          },
        },
        address: { type: 'string', example: '123 Awolowo Road, Ikoyi' },
        notes: { type: 'string', example: 'Gate code: #1234' },
        matchingTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'EVT-001' },
              type: { type: 'string', example: 'matching_started' },
              timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
              agentId: { type: 'string', example: 'AGT001' },
              agentName: { type: 'string', example: 'Samuel Kamau' },
              details: { type: 'string', example: 'Auto-matching initiated' },
            },
          },
        },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-15T10:32:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async getPickupRequest(@Param('id') id: string) {
    return this.getPickupRequestUseCase.execute(id);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually assign an agent to a pickup request' })
  @ApiResponse({
    status: 200,
    description: 'Agent assigned successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'assigned' },
        assignedAgentId: { type: 'string', example: 'AGT001' },
        assignedAgentName: { type: 'string', example: 'Samuel Kamau' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot assign agent - invalid state or agent already busy' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async assignAgent(
    @Param('id') id: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.assignAgentUseCase.execute(id, dto.agentId, dto.agentName);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel a pickup request. Reason required if agent has accepted.' })
  @ApiResponse({
    status: 200,
    description: 'Pickup request cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        pickup: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            status: { type: 'string', example: 'cancelled' },
            cancellationReason: { type: 'string', example: 'User requested cancellation' },
            cancelledAt: { type: 'string', example: '2024-01-15T10:45:00.000Z' },
          },
        },
        cancellationStats: {
          type: 'object',
          properties: {
            totalCancellations: { type: 'number', example: 3 },
            cancellationsThisMonth: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel pickup in current state or reason required' })
  @ApiResponse({ status: 403, description: 'Cannot cancel another user\'s pickup' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async cancelPickupRequest(
    @Param('id') id: string,
    @Body() dto: CancelPickupRequestDto,
    @Request() req,
  ) {
    const cancellerRole = req.user.role === 'admin' || req.user.role === 'super_admin' 
      ? 'admin' 
      : 'user';
    
    return this.cancelPickupRequestUseCase.execute(
      id,
      dto.reason,
      req.user.id,
      req.user.name || req.user.fullName || req.user.id,
      cancellerRole,
    );
  }

  @Patch(':id/convert-mode')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Convert pickup mode between pickup and dropoff' })
  @ApiResponse({
    status: 200,
    description: 'Pickup mode converted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        pickupMode: { type: 'string', example: 'dropoff' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot convert mode for pickup in current state' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async convertPickupMode(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.convertPickupModeUseCase.execute(
      id,
      req.user.name || req.user.fullName || req.user.id,
    );
  }

  @Patch(':id/escalate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Escalate a pickup request to ops lead' })
  @ApiResponse({
    status: 200,
    description: 'Pickup request escalated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        escalatedTo: { type: 'string', example: 'ops_lead' },
        escalatedAt: { type: 'string', example: '2024-01-15T10:50:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot escalate pickup in current state' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async escalatePickupRequest(
    @Param('id') id: string,
    @Body() dto: EscalatePickupRequestDto,
    @Request() req,
  ) {
    return this.escalatePickupRequestUseCase.execute(
      id,
      dto.escalatedTo,
      req.user.name || req.user.fullName || req.user.id,
    );
  }

  @Patch(':id/retrigger')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Re-trigger matching for a failed or cancelled pickup request' })
  @ApiResponse({
    status: 200,
    description: 'Matching re-triggered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'matching' },
        slaDeadline: { type: 'string', example: '2024-01-15T12:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot re-trigger matching in current state' })
  @ApiResponse({ status: 404, description: 'Pickup request not found' })
  async retriggerMatching(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.retriggerMatchingUseCase.execute(
      id,
      req.user.name || req.user.fullName || req.user.id,
    );
  }
}
