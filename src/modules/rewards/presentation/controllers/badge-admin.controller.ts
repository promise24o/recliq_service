import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../../shared/constants/roles';
import { Inject } from '@nestjs/common';
import type { IBadgeRepository } from '../../domain/repositories/reward.repository';
import { Badge } from '../../domain/entities/badge.entity';

// DTOs for admin operations
export class CreateBadgeDto {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'FIRST_RECYCLE' | 'WEIGHT_THRESHOLD' | 'PICKUP_COUNT' | 'STREAK_WEEKS' | 'REFERRAL_COUNT';
    value: number;
  };
}

export class UpdateBadgeDto {
  name?: string;
  description?: string;
  icon?: string;
  criteria?: {
    type: 'FIRST_RECYCLE' | 'WEIGHT_THRESHOLD' | 'PICKUP_COUNT' | 'STREAK_WEEKS' | 'REFERRAL_COUNT';
    value: number;
  };
  isActive?: boolean;
}

@ApiTags('Admin Badges')
@Controller('admin/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
export class BadgeAdminController {
  private readonly logger = new Logger(BadgeAdminController.name);

  constructor(
    @Inject('IBadgeRepository')
    private readonly badgeRepository: IBadgeRepository,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all badges (Admin)',
    description: 'Retrieves all badges including active and inactive ones. Admin only endpoint.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badges retrieved successfully',
    type: [Badge]
  })
  async getAllBadges() {
    const badges = await this.badgeRepository.findAll();
    return {
      success: true,
      data: badges,
      count: badges.length
    };
  }

  @Get(':badgeId')
  @ApiOperation({ 
    summary: 'Get badge by ID (Admin)',
    description: 'Retrieves a specific badge by its ID. Admin only endpoint.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge retrieved successfully',
    type: Badge
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Badge not found'
  })
  async getBadgeById(@Param('badgeId') badgeId: string) {
    const badge = await this.badgeRepository.findById(badgeId);
    
    if (!badge) {
      return {
        success: false,
        message: 'Badge not found'
      };
    }

    return {
      success: true,
      data: badge
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create new badge (Admin)',
    description: 'Creates a new badge with specified criteria. Admin only endpoint.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Badge created successfully',
    type: Badge
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Badge already exists or invalid data'
  })
  async createBadge(@Body() createBadgeDto: CreateBadgeDto) {
    try {
      // Check if badge already exists
      const existingBadge = await this.badgeRepository.findById(createBadgeDto.badgeId);
      if (existingBadge) {
        return {
          success: false,
          message: 'Badge with this ID already exists'
        };
      }

      const badge = new Badge(
        createBadgeDto.badgeId,
        createBadgeDto.name,
        createBadgeDto.description,
        createBadgeDto.criteria,
        createBadgeDto.icon,
        true
      );

      const createdBadge = await this.badgeRepository.create(badge);
      
      this.logger.log(`Admin created new badge: ${createdBadge.badgeId}`);

      return {
        success: true,
        message: 'Badge created successfully',
        data: createdBadge
      };
    } catch (error) {
      this.logger.error('Failed to create badge:', error);
      return {
        success: false,
        message: 'Failed to create badge',
        error: error.message
      };
    }
  }

  @Put(':badgeId')
  @ApiOperation({ 
    summary: 'Update badge (Admin)',
    description: 'Updates an existing badge. Admin only endpoint.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Badge updated successfully',
    type: Badge
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Badge not found'
  })
  async updateBadge(
    @Param('badgeId') badgeId: string, 
    @Body() updateBadgeDto: UpdateBadgeDto
  ) {
    try {
      const existingBadge = await this.badgeRepository.findById(badgeId);
      
      if (!existingBadge) {
        return {
          success: false,
          message: 'Badge not found'
        };
      }

      // Create new badge instance with updated properties
      const updatedBadge = new Badge(
        existingBadge.badgeId,
        updateBadgeDto.name || existingBadge.name,
        updateBadgeDto.description || existingBadge.description,
        updateBadgeDto.criteria || existingBadge.criteria,
        updateBadgeDto.icon || existingBadge.icon,
        updateBadgeDto.isActive !== undefined ? updateBadgeDto.isActive : existingBadge.isActive
      );

      const savedBadge = await this.badgeRepository.update(updatedBadge);
      
      this.logger.log(`Admin updated badge: ${badgeId}`);

      return {
        success: true,
        message: 'Badge updated successfully',
        data: updatedBadge
      };
    } catch (error) {
      this.logger.error('Failed to update badge:', error);
      return {
        success: false,
        message: 'Failed to update badge',
        error: error.message
      };
    }
  }

  @Delete(':badgeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete badge (Admin)',
    description: 'Soft deletes a badge by setting it to inactive. Admin only endpoint.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Badge deleted successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Badge not found'
  })
  async deleteBadge(@Param('badgeId') badgeId: string) {
    try {
      const badge = await this.badgeRepository.findById(badgeId);
      
      if (!badge) {
        return {
          success: false,
          message: 'Badge not found'
        };
      }

      // Create new badge instance with inactive status
      const inactiveBadge = new Badge(
        badge.badgeId,
        badge.name,
        badge.description,
        badge.criteria,
        badge.icon,
        false
      );
      
      await this.badgeRepository.update(inactiveBadge);
      
      this.logger.log(`Admin deleted badge: ${badgeId}`);

      return {
        success: true,
        message: 'Badge deleted successfully'
      };
    } catch (error) {
      this.logger.error('Failed to delete badge:', error);
      return {
        success: false,
        message: 'Failed to delete badge',
        error: error.message
      };
    }
  }
}
