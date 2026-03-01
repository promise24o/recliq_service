import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetServiceRadiusUseCase } from '../../application/use-cases/get-service-radius.usecase';
import { UpdateServiceRadiusUseCase } from '../../application/use-cases/update-service-radius.usecase';
import { UpdateServiceRadiusDto, ServiceRadiusResponseDto } from '../../../auth/presentation/dto/service-radius.dto';

@ApiTags('Service Radius')
@Controller('service-radius')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceRadiusController {
  constructor(
    private readonly getServiceRadiusUseCase: GetServiceRadiusUseCase,
    private readonly updateServiceRadiusUseCase: UpdateServiceRadiusUseCase,
  ) {}

  @Get()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get service radius settings' })
  @ApiResponse({
    status: 200,
    description: 'Service radius retrieved successfully',
    type: ServiceRadiusResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User/Agent role required' })
  async getServiceRadius(@Request() req): Promise<ServiceRadiusResponseDto> {
    return this.getServiceRadiusUseCase.execute(req.user.id);
  }

  @Put()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update service radius settings' })
  @ApiResponse({
    status: 200,
    description: 'Service radius updated successfully',
    type: ServiceRadiusResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid radius value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User/Agent role required' })
  async updateServiceRadius(
    @Request() req,
    @Body() dto: UpdateServiceRadiusDto,
  ): Promise<ServiceRadiusResponseDto> {
    // Extract location from request if available
    const userLocation = req.user.location ? {
      latitude: req.user.location.coordinates[1],
      longitude: req.user.location.coordinates[0],
    } : undefined;

    return this.updateServiceRadiusUseCase.execute(req.user.id, dto, userLocation);
  }
}
