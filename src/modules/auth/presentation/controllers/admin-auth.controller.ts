import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../domain/constants/user.constants';
import { PlatformRolesGuard } from '../../../../shared/guards/platform-roles.guard';
import { AdminOnlyPlatform } from '../../../../shared/decorators/platform-roles.decorator';
import { AuthThrottleGuard } from '../../../../shared/guards/throttle.guard';
import { LoginThrottle, OtpThrottle, RefreshThrottle } from '../../../../shared/decorators/auth-throttle.decorator';

@ApiTags('admin-auth')
@Controller('admin/auth')
@UseGuards(AuthThrottleGuard)
export class AdminAuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('login')
  @LoginThrottle()
  @ApiOperation({ summary: 'Admin login - Web only' })
  @ApiResponse({ 
    status: 201, 
    description: 'Login successful - OTP sent to your email',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent to your email' },
        requiresOtp: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid password or wrong platform' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(@Body() dto: LoginDto, @Request() req) {
    return this.loginUseCase.execute(dto, req);
  }

  @Post('verify-otp')
  @OtpThrottle()
  @ApiOperation({ summary: 'Admin OTP verification - Web only' })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Authentication successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '695a954e38016c3786d5327c' },
            email: { type: 'string', example: 'admin@recliq.com' },
            name: { type: 'string', example: 'Admin User' },
            role: { type: 'string', example: 'ADMIN' },
            adminSubRole: { type: 'string', example: 'SUPER_ADMIN' }
          }
        },
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required or wrong platform' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Request() req) {
    return this.verifyOtpUseCase.execute({
      identifier: dto.identifier,
      otp: dto.otp,
    }, req);
  }

  @Post('refresh')
  @RefreshThrottle()
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @AdminOnlyPlatform
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh admin access token - Web only' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required or wrong platform' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute({ refreshToken: dto.refreshToken });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard, PlatformRolesGuard)
  @AdminOnlyPlatform
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile - Web only' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '695a954e38016c3786d5327c' },
        email: { type: 'string', example: 'admin@recliq.com' },
        name: { type: 'string', example: 'Admin User' },
        role: { type: 'string', example: 'ADMIN' },
        adminSubRole: { type: 'string', example: 'SUPER_ADMIN' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required or wrong platform' })
  async getProfile(@Request() req) {
    return req.user;
  }
}
