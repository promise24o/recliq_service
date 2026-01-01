import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.usecase';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../../shared/constants/roles';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyOtpUseCase.execute(dto);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }
}