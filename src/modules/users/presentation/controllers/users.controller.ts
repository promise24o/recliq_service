import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  Response,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetUsersUseCase } from '../../application/use-cases/get-users.usecase';
import { GetUserSummaryUseCase } from '../../application/use-cases/get-user-summary.usecase';
import { GetUserDetailUseCase } from '../../application/use-cases/get-user-detail.usecase';
import { UserActionUseCase } from '../../application/use-cases/user-action.usecase';
import { ExportUsersUseCase } from '../../application/use-cases/export-users.usecase';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UserActionDto } from '../dto/user-action.dto';
import { ExportUsersDto } from '../dto/export-users.dto';
import { UserResponseDto, UserPaginationResponseDto } from '../dto/user-response.dto';
import type { Response as ExpressResponse } from 'express';

@ApiTags('Users Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserSummaryUseCase: GetUserSummaryUseCase,
    private readonly getUserDetailUseCase: GetUserDetailUseCase,
    private readonly userActionUseCase: UserActionUseCase,
    private readonly exportUsersUseCase: ExportUsersUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: UserPaginationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUsers(@Query() filterDto: UserFilterDto): Promise<UserPaginationResponseDto> {
    return this.getUsersUseCase.execute(filterDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get user summary statistics' })
  @ApiResponse({ status: 200, description: 'User summary retrieved successfully' })
  async getUserSummary() {
    return this.getUserSummaryUseCase.execute();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by query' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: UserPaginationResponseDto,
  })
  async searchUsers(@Query('q') query: string, @Query() filterDto: Partial<UserFilterDto>): Promise<UserPaginationResponseDto> {
    if (!query) {
      return { users: [], pagination: { total: 0, page: 1, limit: 25, pages: 0 } };
    }
    return this.getUsersUseCase.executeSearch(query, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User details retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('id') id: string): Promise<UserResponseDto> {
    return this.getUserDetailUseCase.execute(id);
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform action on user (suspend, reactivate, flag)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Action performed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid action or user state' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async performUserAction(@Param('id') id: string, @Body() actionDto: UserActionDto) {
    return this.userActionUseCase.execute(id, actionDto);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export users data (CSV or PDF)' })
  @ApiResponse({ status: 200, description: 'Export file generated successfully' })
  async exportUsers(@Body() exportDto: ExportUsersDto, @Response() res: ExpressResponse) {
    const { data, filename, contentType } = await this.exportUsersUseCase.execute(exportDto);

    if (exportDto.format === 'csv') {
      const csvData = this.convertToCSV(data);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } else {
      // For PDF, you would typically use a PDF generation library
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({ message: 'PDF export not implemented yet', data });
    }
  }

  @Get('cities/list')
  @ApiOperation({ summary: 'Get list of cities with users' })
  @ApiResponse({ status: 200, description: 'Cities list retrieved successfully' })
  async getCities() {
    // This would be implemented in the repository
    return { cities: ['Lagos', 'Port Harcourt', 'Abuja', 'Kano', 'Ibadan'] };
  }

  @Get('zones/list')
  @ApiOperation({ summary: 'Get list of zones with users' })
  @ApiResponse({ status: 200, description: 'Zones list retrieved successfully' })
  async getZones() {
    // This would be implemented in the repository
    return { zones: ['Ikoyi', 'Victoria Island', 'GRA', 'Sabon Gari', 'Maitama'] };
  }

  private convertToCSV(users: any[]): string {
    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'City',
      'Zone',
      'Status',
      'Type',
      'Total Recycles',
      'Last Activity',
      'Created',
      'Wallet Balance',
      'Pending Escrow',
      'Disputes Raised',
      'Cancellations',
      'Avg Response Time'
    ];

    const csvRows = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        `"${user.name}"`,
        user.phone,
        user.email,
        user.city,
        user.zone,
        user.status,
        user.type,
        user.totalRecycles,
        user.lastActivity,
        user.created,
        user.walletBalance,
        user.pendingEscrow,
        user.disputesRaised,
        user.cancellations,
        user.avgResponseTime
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}
