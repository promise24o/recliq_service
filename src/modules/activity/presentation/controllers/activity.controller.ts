import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  Res
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetActivityLogsUseCase } from '../../application/use-cases/get-activity-logs.usecase';
import { GetActivitySummaryUseCase } from '../../application/use-cases/get-activity-summary.usecase';
import { GetSecuritySignalsUseCase } from '../../application/use-cases/get-security-signals.usecase';
import { AcknowledgeSecuritySignalUseCase } from '../../application/use-cases/acknowledge-security-signal.usecase';
import { ActivityFilterDto } from '../dto/activity-filter.dto';
import { SecuritySignalFilterDto } from '../dto/security-signal-filter.dto';

@ApiTags('activity')
@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(
    private readonly getActivityLogsUseCase: GetActivityLogsUseCase,
    private readonly getActivitySummaryUseCase: GetActivitySummaryUseCase,
    private readonly getSecuritySignalsUseCase: GetSecuritySignalsUseCase,
    private readonly acknowledgeSecuritySignalUseCase: AcknowledgeSecuritySignalUseCase,
  ) {}

  @Get('logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get activity logs with filtering options' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivityLogs(
    @Query() filterDto: ActivityFilterDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    // If no userId is specified and user is not super admin, force their own userId
    if (!filterDto.userId && req.user.role !== UserRole.SUPER_ADMIN) {
      filterDto.userId = req.user.id;
    }

    // filterDto already has the correct types that match ActivityFilter
    // since we updated ActivityFilter to accept string | Date
    return this.getActivityLogsUseCase.execute(filterDto, page, limit);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get activity summary for the current user' })
  @ApiResponse({ status: 200, description: 'Activity summary retrieved successfully' })
  async getActivitySummary(@Req() req: any) {
    return this.getActivitySummaryUseCase.execute(req.user.id);
  }

  @Get('security-signals')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security signals for the current user' })
  @ApiResponse({ status: 200, description: 'Security signals retrieved successfully' })
  @ApiQuery({ name: 'includeAcknowledged', required: false, type: Boolean })
  async getSecuritySignals(
    @Query() filterDto: SecuritySignalFilterDto,
    @Query('includeAcknowledged', new DefaultValuePipe(false)) includeAcknowledged: boolean,
    @Req() req: any,
  ) {
    // If no userId is specified and user is not super admin, force their own userId
    if (!filterDto.userId && req.user.role !== UserRole.SUPER_ADMIN) {
      filterDto.userId = req.user.id;
    }

    // filterDto already has the correct types that match SecuritySignalFilter
    // since we updated SecuritySignalFilter to accept string | Date
    return this.getSecuritySignalsUseCase.execute(filterDto, includeAcknowledged);
  }

  @Post('security-signals/:id/acknowledge')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Acknowledge a security signal' })
  @ApiResponse({ status: 200, description: 'Security signal acknowledged successfully' })
  @ApiResponse({ status: 404, description: 'Security signal not found' })
  async acknowledgeSecuritySignal(@Param('id') id: string) {
    return this.acknowledgeSecuritySignalUseCase.execute(id);
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export activity logs as CSV' })
  @ApiResponse({ status: 200, description: 'Activity logs exported successfully' })
  async exportActivityLogs(
    @Query() filterDto: ActivityFilterDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    // If no userId is specified and user is not super admin, force their own userId
    if (!filterDto.userId && req.user.role !== UserRole.SUPER_ADMIN) {
      filterDto.userId = req.user.id;
    }
    
    // Get all logs for export (no pagination)
    const { events } = await this.getActivityLogsUseCase.execute(filterDto, 1, 1000);
    
    // Generate CSV content
    const csvHeader = 'Timestamp,Action,Description,Entity Type,Entity ID,Risk Level,Source,IP Address,Device,Location,Outcome\n';
    const csvRows = events.map(event => {
      return `"${event.timestamp}","${event.actionLabel}","${event.description}","${event.entityType}","${event.entityId}","${event.riskLevel}","${event.source}","${event.ipAddress}","${event.device}","${event.location}","${event.outcome}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
    
    // Send the CSV content
    return res.send(csvContent);
  }
}
