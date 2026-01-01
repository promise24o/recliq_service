import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { AuthRepositoryImpl } from './infrastructure/persistence/auth.repository.impl';
import { BrevoEmailService } from './infrastructure/email/brevo.email.service';
import { OtpService } from './infrastructure/security/otp.service';
import { AuthJwtService } from './infrastructure/security/auth-jwt.service';
import { UserSchema } from './infrastructure/persistence/user.model';
import { Env } from '../../core/config/env';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-access-secret',
      signOptions: { expiresIn: '15m' },
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    VerifyOtpUseCase,
    RefreshTokenUseCase,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryImpl,
    },
    BrevoEmailService,
    OtpService,
    AuthJwtService,
    Env,
  ],
  exports: [AuthJwtService, 'IAuthRepository'],
})
export class AuthModule {}