import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { ResendOtpUseCase } from '../../application/use-cases/resend-otp.usecase';
import { SetupPinUseCase } from '../../application/use-cases/setup-pin.usecase';
import { BiometricUseCase } from '../../application/use-cases/biometric.usecase';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.usecase';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.usecase';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.usecase';
import { UpdatePinUseCase } from '../../application/use-cases/update-pin.usecase';
import { ForgotPinUseCase } from '../../application/use-cases/forgot-pin.usecase';
import { SendPinResetOtpUseCase } from '../../application/use-cases/send-pin-reset-otp.usecase';
import { BackblazeService } from '../../infrastructure/storage/backblaze.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { SetupPinDto } from '../dto/setup-pin.dto';
import { BiometricDto } from '../dto/biometric.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UploadPhotoDto } from '../dto/upload-photo.dto';
import { UpdatePinDto } from '../dto/update-pin.dto';
import { ForgotPinDto } from '../dto/forgot-pin.dto';
import { SendPinResetOtpDto } from '../dto/send-pin-reset-otp.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../../shared/constants/roles';
import { AuthThrottleGuard } from '../../../../shared/guards/throttle.guard';
import { RegisterThrottle, LoginThrottle, OtpThrottle, RefreshThrottle } from '../../../../shared/decorators/auth-throttle.decorator';

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthThrottleGuard)
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
    private readonly setupPinUseCase: SetupPinUseCase,
    private readonly biometricUseCase: BiometricUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updatePinUseCase: UpdatePinUseCase,
    private readonly forgotPinUseCase: ForgotPinUseCase,
    private readonly sendPinResetOtpUseCase: SendPinResetOtpUseCase,
    private readonly backblazeService: BackblazeService,
  ) {}

  @Post('register')
  @RegisterThrottle()
  @ApiOperation({ summary: 'Register a new user with phone or email' })
  @ApiResponse({ status: 201, description: 'OTP sent to your email successfully successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or user exists' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @LoginThrottle()
  @ApiOperation({ summary: 'Login with phone or email and password' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid password' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Post('verify-otp')
  @OtpThrottle()
  @ApiOperation({ summary: 'Verify OTP and complete authentication' })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication successful, returns tokens',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Authentication successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6956cd1d842c6afdc694d3fe' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'USER' },
            isVerified: { type: 'boolean', example: true },
            biometricEnabled: { type: 'boolean', example: false },
            profilePhoto: { type: 'string', example: null },
            notifications: {
              type: 'object',
              properties: {
                priceUpdates: { type: 'boolean', example: false },
                loginEmails: { type: 'boolean', example: false }
              }
            },
            hasPin: { type: 'boolean', example: true },
            pin: { type: 'string', example: 'hashed_pin_value' },
            createdAt: { type: 'string', example: '2026-01-01T19:38:05.542Z' },
            updatedAt: { type: 'string', example: '2026-01-02T10:57:10.765Z' }
          }
        },
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
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
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
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
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('resend-otp')
  @OtpThrottle()
  @ApiOperation({ summary: 'Resend OTP to existing user' })
  @ApiResponse({ status: 200, description: 'OTP sent to your email successfully successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid identifier or user already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.resendOtpUseCase.execute(dto);
  }

  @Post('forgot-password')
  @OtpThrottle()
  @ApiOperation({ summary: 'Send password reset OTP to email' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset OTP sent to your email' },
        email: { type: 'string', example: 'user@example.com' },
        expires_in: { type: 'number', example: 600 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid email format' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP and login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully and user logged in',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6956cd1d842c6afdc694d3fe' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'USER' },
            isVerified: { type: 'boolean', example: true },
            biometricEnabled: { type: 'boolean', example: false },
            profilePhoto: { type: 'string', example: null },
            notifications: {
              type: 'object',
              properties: {
                priceUpdates: { type: 'boolean', example: false },
                loginEmails: { type: 'boolean', example: false }
              }
            },
            hasPin: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '2026-01-01T19:38:05.542Z' },
            updatedAt: { type: 'string', example: '2026-01-02T10:57:10.765Z' }
          }
        },
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid OTP or user not verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute({
      email: dto.email,
      otp: dto.otp,
      newPassword: dto.newPassword,
    });
  }

  @Post('setup-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set up transaction PIN' })
  @ApiResponse({ 
    status: 200, 
    description: 'PIN set up successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'PIN set up successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid PIN or user not verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setupPin(@Body() dto: SetupPinDto, @Request() req) {
    return this.setupPinUseCase.execute({
      userId: req.user.id,
      pin: dto.pin,
    });
  }

  @Post('update-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update transaction PIN' })
  @ApiResponse({ status: 200, description: 'PIN updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid PIN or no PIN set' })
  @ApiResponse({ status: 401, description: 'Unauthorized - current PIN incorrect' })
  async updatePin(@Body() dto: UpdatePinDto, @Request() req) {
    return this.updatePinUseCase.execute({
      userId: req.user.id,
      oldPin: dto.oldPin,
      newPin: dto.newPin,
    });
  }

  @Post('forgot-pin')
  @ApiOperation({ summary: 'Reset PIN with OTP' })
  @ApiResponse({ status: 200, description: 'PIN reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid OTP or user not verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPin(@Body() dto: ForgotPinDto) {
    return this.forgotPinUseCase.execute({
      email: dto.email,
      otp: dto.otp,
      newPin: dto.newPin,
    });
  }

  @Post('send-pin-reset-otp')
  @OtpThrottle()
  @ApiOperation({ summary: 'Send PIN reset OTP to email' })
  @ApiResponse({ 
    status: 200, 
    description: 'PIN reset OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'PIN reset OTP sent to your email' },
        email: { type: 'string', example: 'user@example.com' },
        expires_in: { type: 'number', example: 600 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid email or user not verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async sendPinResetOtp(@Body() dto: SendPinResetOtpDto) {
    return this.sendPinResetOtpUseCase.execute({
      email: dto.email,
    });
  }

  @Post('biometric')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enable or disable biometric access' })
  @ApiResponse({ status: 200, description: 'Biometric access updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user not verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async biometric(@Body() dto: BiometricDto, @Request() req) {
    return this.biometricUseCase.execute({
      userId: req.user.id,
      enabled: dto.enabled,
    });
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req) {
    return this.updateProfileUseCase.execute({
      userId: req.user.id,
      profilePhoto: dto.profilePhoto,
      phone: dto.phone,
      priceUpdates: dto.priceUpdates,
      loginEmails: dto.loginEmails,
    });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid current password or new password same as current' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req) {
    return this.changePasswordUseCase.execute({
      userId: req.user.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('upload-photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiResponse({ status: 200, description: 'Profile photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadPhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file  uploaded');
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, JPG, and PNG are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Upload to Backblaze
    const photoUrl = await this.backblazeService.uploadProfilePhoto(
      req.user.id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // Update user profile with new photo URL
    return this.updateProfileUseCase.execute({
      userId: req.user.id,
      profilePhoto: photoUrl,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '6956cd1d842c6afdc694d3fe' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+2348012345678' },
        role: { type: 'string', example: 'USER' },
        adminSubRole: { type: 'string', example: 'SUPER_ADMIN', nullable: true },
        isVerified: { type: 'boolean', example: true },
        biometricEnabled: { type: 'boolean', example: false },
        profilePhoto: { type: 'string', example: null },
        referralCode: { type: 'string', example: 'ABC123' },
        notifications: {
          type: 'object',
          properties: {
            priceUpdates: { type: 'boolean', example: false },
            loginEmails: { type: 'boolean', example: false }
          }
        },
        hasPin: { type: 'boolean', example: true },
        pin: { type: 'string', example: 'hashed_pin_value' },
        createdAt: { type: 'string', example: '2026-01-01T19:38:05.542Z' },
        updatedAt: { type: 'string', example: '2026-01-02T10:57:10.765Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = req.user;
    
    // Check if user has PIN set
    const hasPin = !!user.pin;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone?.getValue() || null,
      role: user.role,
      adminSubRole: user.adminSubRole || null,
      isVerified: user.isVerified,
      biometricEnabled: user.biometricEnabled,
      profilePhoto: user.profilePhoto,
      referralCode: user.referralCode,
      notifications: user.notifications,
      hasPin,
      pin: user.pin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}