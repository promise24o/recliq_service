import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.usecase';
import { MarkAsReadUseCase } from '../../application/use-cases/mark-notification-read.usecase';
import { MarkAllAsReadUseCase } from '../../application/use-cases/mark-all-notifications-read.usecase';
import { SeedNotificationsUseCase } from '../../application/use-cases/seed-notifications.usecase';
import { 
  GetNotificationsDto, 
  MarkAsReadDto, 
  MarkAllAsReadDto,
  NotificationResponseDto,
  NotificationListResponseDto 
} from '../dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly seedNotificationsUseCase: SeedNotificationsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationResponseDto' }
        },
        unreadCount: { type: 'number', example: 5 },
        hasMore: { type: 'boolean', example: true },
        total: { type: 'number', example: 25 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @Query() query: GetNotificationsDto,
    @Request() req
  ): Promise<NotificationListResponseDto> {
    const result = await this.getNotificationsUseCase.execute({
      userId: req.user.id,
      category: query.category,
      type: query.type,
      unreadOnly: query.unreadOnly,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      notifications: result.notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category,
        type: n.type,
        priority: n.priority,
        read: n.read,
        createdAt: (n.createdAt as any).toISOString ? (n.createdAt as any).toISOString() : n.createdAt,
        metadata: n.metadata,
      })),
      unreadCount: result.unreadCount,
      hasMore: result.hasMore,
      total: result.total,
    };
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Body() dto: MarkAsReadDto,
    @Request() req
  ): Promise<{ message: string }> {
    await this.markAsReadUseCase.execute({
      userId: req.user.id,
      notificationId: dto.notificationId,
    });

    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req): Promise<{ message: string }> {
    await this.markAllAsReadUseCase.execute(req.user.id);

    return { message: 'All notifications marked as read' };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample notifications (for development)' })
  @ApiResponse({ status: 200, description: 'Notifications seeded successfully' })
  async seedNotifications(): Promise<{ message: string; count: number }> {
    const result = await this.seedNotificationsUseCase.execute();

    return {
      message: 'Notifications seeded successfully',
      count: result.count,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const result = await this.getNotificationsUseCase.execute({
      userId: req.user.id,
      unreadOnly: true,
      limit: 1000, // Get all unread notifications
    });

    return { count: result.total };
  }
}
