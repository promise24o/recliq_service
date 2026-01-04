import { IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationCategory, NotificationType } from '../../domain/enums/notification-type.enum';
import { Transform } from 'class-transformer';

export class GetNotificationsDto {
  @ApiProperty({ 
    description: 'Filter by category', 
    enum: NotificationCategory,
    required: false
  })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiProperty({ 
    description: 'Filter by type', 
    enum: NotificationType,
    required: false
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ 
    description: 'Show only unread notifications', 
    required: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean = false;

  @ApiProperty({ 
    description: 'Number of notifications to return', 
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Number of notifications to skip', 
    required: false,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class MarkAsReadDto {
  @ApiProperty({ 
    description: 'Notification ID to mark as read', 
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  notificationId: string;
}

export class MarkAllAsReadDto {
  @ApiProperty({ 
    description: 'Mark all notifications as read', 
    default: true
  })
  @IsBoolean()
  markAll: boolean = true;
}

export class NotificationResponseDto {
  @ApiProperty({ 
    description: 'Notification ID', 
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({ 
    description: 'Notification type', 
    enum: NotificationType,
    example: NotificationType.WALLET_CREDIT
  })
  type: NotificationType;

  @ApiProperty({ 
    description: 'Notification category', 
    enum: NotificationCategory,
    example: NotificationCategory.FINANCE
  })
  category: NotificationCategory;

  @ApiProperty({ 
    description: 'Notification title', 
    example: 'Wallet Credited'
  })
  title: string;

  @ApiProperty({ 
    description: 'Notification message', 
    example: '₦1,500 has been added to your wallet for PET pickup.'
  })
  message: string;

  @ApiProperty({ 
    description: 'Notification priority', 
    enum: ['high', 'medium', 'low'],
    example: 'high'
  })
  priority: string;

  @ApiProperty({ 
    description: 'Whether notification is read', 
    example: false
  })
  read: boolean;

  @ApiProperty({ 
    description: 'Action URL', 
    example: '/wallet',
    required: false
  })
  actionUrl?: string;

  @ApiProperty({ 
    description: 'Action button text', 
    example: 'View Wallet',
    required: false
  })
  actionText?: string;

  @ApiProperty({ 
    description: 'Notification image URL', 
    required: false
  })
  imageUrl?: string;

  @ApiProperty({ 
    description: 'Additional metadata', 
    required: false
  })
  metadata?: Record<string, any>;

  @ApiProperty({ 
    description: 'Creation timestamp', 
    example: '2026-01-02T10:30:00.000Z'
  })
  createdAt: string;

  @ApiProperty({ 
    description: 'Read timestamp', 
    example: '2026-01-02T10:35:00.000Z',
    required: false
  })
  readAt?: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ 
    description: 'Array of notifications', 
    type: [NotificationResponseDto]
  })
  notifications: NotificationResponseDto[];

  @ApiProperty({ 
    description: 'Total unread count', 
    example: 5
  })
  unreadCount: number;

  @ApiProperty({ 
    description: 'Has more notifications', 
    example: true
  })
  hasMore: boolean;

  @ApiProperty({ 
    description: 'Total count for current filter', 
    example: 25
  })
  total: number;
}
