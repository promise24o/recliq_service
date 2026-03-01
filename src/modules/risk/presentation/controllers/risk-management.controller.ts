import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RiskManagementUseCase } from '../../application/use-cases/risk-management.usecase';
import { 
  GetRiskUsersQueryDto,
  CreateRiskEventDto,
  RiskActionDto,
  FlagUserDto,
  SuspendUserDto,
  BanUserDto,
  ReinstateUserDto
} from '../dto/risk-management.dto';

@ApiTags('Risk Management')
@Controller('admin/risk')
@UseGuards(JwtAuthGuard)
export class RiskManagementController {
  constructor(private readonly riskManagementUseCase: RiskManagementUseCase) {}

  @Get('users')
  @ApiOperation({ 
    summary: 'Get all risk users',
    description: 'Retrieve a paginated list of users with risk states, with filtering and sorting options'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', example: 25 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone, or user ID' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'riskState', required: false, description: 'Filter by risk state' })
  @ApiQuery({ name: 'reason', required: false, description: 'Filter by reason' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field', enum: ['name', 'since', 'lastActivity', 'riskState'] })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk users retrieved successfully'
  })
  async getRiskUsers(@Query() query: GetRiskUsersQueryDto): Promise<any> {
    return this.riskManagementUseCase.getRiskUsers(query);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get risk summary',
    description: 'Retrieve a summary of risk statistics across the platform'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk summary retrieved successfully'
  })
  async getRiskSummary(): Promise<any> {
    return this.riskManagementUseCase.getRiskSummary();
  }

  @Get('users/:userId')
  @ApiOperation({ 
    summary: 'Get risk user by ID',
    description: 'Retrieve detailed risk information for a specific user'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk user retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getRiskUserById(@Param('userId') userId: string): Promise<any> {
    const user = await this.riskManagementUseCase.getRiskUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  @Post('events')
  @ApiOperation({ 
    summary: 'Create risk event',
    description: 'Create a new risk event (flag, suspend, ban, reinstate) for a user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Risk event created successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid request or invalid action for current state' })
  async createRiskEvent(
    @Body() createRiskEventDto: CreateRiskEventDto,
    @Request() req
  ): Promise<any> {
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.createRiskEvent(
      createRiskEventDto, 
      actorId, 
      actorName
    );
  }

  @Put('users/:userId/actions')
  @ApiOperation({ 
    summary: 'Execute risk action on user',
    description: 'Perform a risk management action on a user (flag, suspend, reinstate, ban, extend suspension)'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk action executed successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid request or invalid action for current state' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async executeRiskAction(
    @Param('userId') userId: string,
    @Body() riskActionDto: RiskActionDto,
    @Request() req
  ): Promise<any> {
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.executeRiskAction(
      userId, 
      riskActionDto, 
      actorId, 
      actorName
    );
  }

  @Post('users/:userId/flag')
  @ApiOperation({ 
    summary: 'Flag user for review',
    description: 'Flag a user for manual review and monitoring'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'User flagged successfully'
  })
  async flagUser(
    @Param('userId') userId: string,
    @Body() flagUserDto: FlagUserDto,
    @Request() req
  ): Promise<any> {
    const createRiskEventDto: CreateRiskEventDto = {
      userId,
      type: 'flag' as any,
      reason: flagUserDto.reason,
      metadata: flagUserDto.metadata,
    };
    
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.createRiskEvent(
      createRiskEventDto, 
      actorId, 
      actorName
    );
  }

  @Post('users/:userId/suspend')
  @ApiOperation({ 
    summary: 'Suspend user',
    description: 'Temporarily suspend a user for a specified duration'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'User suspended successfully'
  })
  async suspendUser(
    @Param('userId') userId: string,
    @Body() suspendUserDto: SuspendUserDto,
    @Request() req
  ): Promise<any> {
    const createRiskEventDto: CreateRiskEventDto = {
      userId,
      type: 'suspend' as any,
      reason: suspendUserDto.reason,
      duration: suspendUserDto.duration,
      metadata: suspendUserDto.metadata,
    };
    
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.createRiskEvent(
      createRiskEventDto, 
      actorId, 
      actorName
    );
  }

  @Post('users/:userId/ban')
  @ApiOperation({ 
    summary: 'Permanently ban user',
    description: 'Permanently ban a user from the platform'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'User banned successfully'
  })
  async banUser(
    @Param('userId') userId: string,
    @Body() banUserDto: BanUserDto,
    @Request() req
  ): Promise<any> {
    const createRiskEventDto: CreateRiskEventDto = {
      userId,
      type: 'ban' as any,
      reason: banUserDto.reason,
      metadata: banUserDto.metadata,
    };
    
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.createRiskEvent(
      createRiskEventDto, 
      actorId, 
      actorName
    );
  }

  @Post('users/:userId/reinstate')
  @ApiOperation({ 
    summary: 'Reinstate user',
    description: 'Remove all restrictions and restore user access'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'User reinstated successfully'
  })
  async reinstateUser(
    @Param('userId') userId: string,
    @Body() reinstateUserDto: ReinstateUserDto,
    @Request() req
  ): Promise<any> {
    const createRiskEventDto: CreateRiskEventDto = {
      userId,
      type: 'reinstate' as any,
      reason: reinstateUserDto.reason,
      metadata: reinstateUserDto.metadata,
    };
    
    const actorId = req.user?.id || 'system';
    const actorName = req.user?.name || 'System';
    
    return this.riskManagementUseCase.createRiskEvent(
      createRiskEventDto, 
      actorId, 
      actorName
    );
  }
}
