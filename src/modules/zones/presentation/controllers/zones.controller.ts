import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../../shared/constants/roles';
import { CreateCityUseCase } from '../../application/use-cases/create-city.usecase';
import { GetCitiesUseCase } from '../../application/use-cases/get-cities.usecase';
import { GetCityUseCase } from '../../application/use-cases/get-city.usecase';
import { UpdateCityUseCase } from '../../application/use-cases/update-city.usecase';
import { DeleteCityUseCase } from '../../application/use-cases/delete-city.usecase';
import { EnableDisableCityUseCase } from '../../application/use-cases/enable-disable-city.usecase';
import { CreateZoneUseCase } from '../../application/use-cases/create-zone.usecase';
import { UpdateZoneUseCase } from '../../application/use-cases/update-zone.usecase';
import { ActivateDeactivateZoneUseCase } from '../../application/use-cases/activate-deactivate-zone.usecase';
import { SplitZoneUseCase } from '../../application/use-cases/split-zone.usecase';
import { MergeZonesUseCase } from '../../application/use-cases/merge-zones.usecase';
import { GetZonesUseCase } from '../../application/use-cases/get-zones.usecase';
import { GetZoneSummaryUseCase } from '../../application/use-cases/get-zone-summary.usecase';
import { GetZoneInsightsUseCase, ZoneInsight } from '../../application/use-cases/get-zone-insights.usecase';
import type { IZoneRepository } from '../../domain/repositories/zone.repository';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { SplitZoneDto } from '../dto/split-zone.dto';
import { MergeZonesDto } from '../dto/merge-zones.dto';

@ApiTags('zones')
@Controller('zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ZonesController {
  constructor(
    private readonly createCityUseCase: CreateCityUseCase,
    private readonly getCitiesUseCase: GetCitiesUseCase,
    private readonly getCityUseCase: GetCityUseCase,
    private readonly updateCityUseCase: UpdateCityUseCase,
    private readonly deleteCityUseCase: DeleteCityUseCase,
    private readonly enableDisableCityUseCase: EnableDisableCityUseCase,
    private readonly createZoneUseCase: CreateZoneUseCase,
    private readonly updateZoneUseCase: UpdateZoneUseCase,
    private readonly activateDeactivateZoneUseCase: ActivateDeactivateZoneUseCase,
    private readonly splitZoneUseCase: SplitZoneUseCase,
    private readonly mergeZonesUseCase: MergeZonesUseCase,
    private readonly getZonesUseCase: GetZonesUseCase,
    private readonly getZoneSummaryUseCase: GetZoneSummaryUseCase,
    private readonly getZoneInsightsUseCase: GetZoneInsightsUseCase,
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  @Post('cities')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new city' })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiResponse({ status: 400, description: 'City already exists or invalid data' })
  async createCity(@Body() createCityDto: CreateCityDto, @Request() req) {
    return this.createCityUseCase.execute(createCityDto, req.user.id);
  }

  @Get('cities')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  async getCities(
    @Query('state') state?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (state) filters.state = state;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.getCitiesUseCase.execute(filters);
  }

  @Get('cities/with-zones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cities with zone counts' })
  @ApiResponse({ status: 200, description: 'Cities with zone counts retrieved successfully' })
  async getCitiesWithZoneCount() {
    return this.getCitiesUseCase.getCitiesWithZoneCount();
  }

  @Get('zones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all zones' })
  @ApiResponse({ status: 200, description: 'Zones retrieved successfully' })
  async getZones(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('status') status?: string,
    @Query('coverageLevel') coverageLevel?: string,
  ) {
    const filters: any = {};
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (status) filters.status = status;
    if (coverageLevel) filters.coverageLevel = coverageLevel;

    return this.getZonesUseCase.execute(filters);
  }

  @Get('cities/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiResponse({ status: 200, description: 'City retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getCity(@Param('id') id: string) {
    return this.getCityUseCase.execute(id);
  }

  @Patch('cities/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update city' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 400, description: 'Invalid data or city name already exists' })
  async updateCity(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto, @Request() req) {
    return this.updateCityUseCase.execute(id, updateCityDto, req.user.id);
  }

  @Delete('cities/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete city' })
  @ApiResponse({ status: 200, description: 'City deleted successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete city with associated zones' })
  async deleteCity(@Param('id') id: string) {
    await this.deleteCityUseCase.execute(id);
    return { message: 'City deleted successfully' };
  }

  @Patch('cities/:id/enable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable city and associated zones' })
  @ApiResponse({ status: 200, description: 'City enabled successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async enableCity(@Param('id') id: string, @Request() req) {
    return this.enableDisableCityUseCase.execute(id, true, req.user.id);
  }

  @Patch('cities/:id/disable')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable city and associated zones' })
  @ApiResponse({ status: 200, description: 'City disabled successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async disableCity(@Param('id') id: string, @Request() req) {
    return this.enableDisableCityUseCase.execute(id, false, req.user.id);
  }

  // Zone Management Endpoints

  @Post('zones')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new zone' })
  @ApiResponse({ status: 201, description: 'Zone created successfully' })
  @ApiResponse({ status: 400, description: 'Zone already exists or invalid data' })
  async createZone(@Body() createZoneDto: CreateZoneDto, @Request() req) {
    return this.createZoneUseCase.execute(createZoneDto, req.user.id);
  }

  @Get('zones/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get zone summary statistics' })
  @ApiResponse({ status: 200, description: 'Zone summary retrieved successfully' })
  async getZoneSummary() {
    return this.getZoneSummaryUseCase.execute();
  }

  @Get('zones/insights')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get zone performance insights and recommendations' })
  @ApiResponse({ status: 200, description: 'Zone insights retrieved successfully' })
  async getZoneInsights(): Promise<ZoneInsight[]> {
    return this.getZoneInsightsUseCase.execute();
  }

  @Post('zones/split')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Split a zone into two zones' })
  @ApiResponse({ status: 201, description: 'Zone split successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  @ApiResponse({ status: 400, description: 'Invalid split data or zone names already exist' })
  async splitZone(@Body() splitZoneDto: SplitZoneDto, @Request() req) {
    return this.splitZoneUseCase.execute(splitZoneDto, req.user.id);
  }

  @Post('zones/merge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Merge multiple zones into one' })
  @ApiResponse({ status: 201, description: 'Zones merged successfully' })
  @ApiResponse({ status: 404, description: 'One or more zones not found' })
  @ApiResponse({ status: 400, description: 'Invalid merge data or zones not in same city' })
  async mergeZones(@Body() mergeZonesDto: MergeZonesDto, @Request() req) {
    return this.mergeZonesUseCase.execute(mergeZonesDto, req.user.id);
  }

  @Get('zones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get zone by ID' })
  @ApiResponse({ status: 200, description: 'Zone retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async getZone(@Param('id') id: string) {
    return this.zoneRepository.findById(id);
  }

  @Patch('zones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update zone' })
  @ApiResponse({ status: 200, description: 'Zone updated successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  @ApiResponse({ status: 400, description: 'Invalid data or zone name already exists' })
  async updateZone(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto, @Request() req) {
    return this.updateZoneUseCase.execute(id, updateZoneDto, req.user.id);
  }

  @Delete('zones/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete zone' })
  @ApiResponse({ status: 200, description: 'Zone deleted successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async deleteZone(@Param('id') id: string) {
    await this.zoneRepository.delete(id);
    return { message: 'Zone deleted successfully' };
  }

  @Patch('zones/:id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate zone' })
  @ApiResponse({ status: 200, description: 'Zone activated successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async activateZone(@Param('id') id: string, @Request() req) {
    return this.activateDeactivateZoneUseCase.execute(id, true, req.user.id);
  }

  @Patch('zones/:id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate zone' })
  @ApiResponse({ status: 200, description: 'Zone deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async deactivateZone(@Param('id') id: string, @Request() req) {
    return this.activateDeactivateZoneUseCase.execute(id, false, req.user.id);
  }

  @Get('zones/city/:city')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get zones by city' })
  @ApiResponse({ status: 200, description: 'Zones for city retrieved successfully' })
  async getZonesByCity(@Param('city') city: string) {
    return this.getZonesUseCase.getZonesByCity(city);
  }
}
