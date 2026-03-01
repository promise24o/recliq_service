import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Req,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetActivityLogsUseCase } from '../../application/use-cases/get-activity-logs.usecase';
import { ActivityFilterDto } from '../dto/activity-filter.dto';

@ApiTags('User Activity')
@Controller('user-activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserActivityController {
  constructor(
    private readonly getActivityLogsUseCase: GetActivityLogsUseCase,
  ) {}

  @Get('logs')
  @Roles(UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user activity logs with filtering options' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getUserActivityLogs(
    @Query() filterDto: ActivityFilterDto,
    @Req() req: any,
  ) {
    // Force user to only see their own logs unless they're admin
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      filterDto.userId = req.user.id;
    }

    // Use page and limit from filterDto if provided, otherwise use defaults
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;

    return this.getActivityLogsUseCase.execute(filterDto, page, limit);
  }

  @Get('my-logs')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get current user activity logs' })
  @ApiResponse({ status: 200, description: 'User activity logs retrieved successfully' })
  async getMyActivityLogs(
    @Query() filterDto: ActivityFilterDto,
    @Req() req: any,
  ) {
    // Always force to current user's ID
    filterDto.userId = req.user.id;

    // Use page and limit from filterDto if provided, otherwise use defaults
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;

    return this.getActivityLogsUseCase.execute(filterDto, page, limit);
  }
}
