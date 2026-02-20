import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { ResendOtpUseCase } from './application/use-cases/resend-otp.usecase';
import { SetupPinUseCase } from './application/use-cases/setup-pin.usecase';
import { BiometricUseCase } from './application/use-cases/biometric.usecase';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.usecase';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.usecase';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';
import { UpdatePinUseCase } from './application/use-cases/update-pin.usecase';
import { ForgotPinUseCase } from './application/use-cases/forgot-pin.usecase';
import { SendPinResetOtpUseCase } from './application/use-cases/send-pin-reset-otp.usecase';
import { BrevoSmsService } from './infrastructure/sms/brevo.sms.service';
import { OtpService } from './infrastructure/security/otp.service';
import { AuthJwtService } from './infrastructure/security/auth-jwt.service';
import { PasswordService } from './infrastructure/security/password.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { BackblazeService } from './infrastructure/storage/backblaze.service';
import { UserSchema } from './infrastructure/persistence/user.model';
import { ActivitySchema } from './infrastructure/persistence/activity.model';
import { AuthRepositoryImpl } from './infrastructure/persistence/auth.repository.impl';
import { ActivityLoggingService } from './domain/services/activity-logging.service';
import { Env } from '../../core/config/env';
import { AuthThrottleGuard } from '../../shared/guards/throttle.guard';
import { SharedEmailModule } from '../../shared/email/shared-email.module';
import { RewardsModule } from '../rewards/rewards.module';
import { WalletModule } from '../wallet/wallet.module';
import { ReferralRewardRepositoryImpl } from '../rewards/infrastructure/persistence/referral-reward.repository.impl';
import { ReferralRewardSchema } from '../rewards/infrastructure/persistence/referral-reward.model';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-access-secret',
      signOptions: { expiresIn: '7d' },
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Activity', schema: ActivitySchema },
      { name: 'ReferralRewardDocument', schema: ReferralRewardSchema },
    ]),
    ThrottlerModule.forRoot([{
      ttl: 60, // 1 minute
      limit: 100, // 100 requests per minute globally
    }]),
    SharedEmailModule,
    RewardsModule,
    forwardRef(() => WalletModule),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    VerifyOtpUseCase,
    RefreshTokenUseCase,
    ResendOtpUseCase,
    SetupPinUseCase,
    BiometricUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    UpdatePinUseCase,
    ForgotPinUseCase,
    SendPinResetOtpUseCase,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepositoryImpl,
    },
    {
      provide: 'IReferralRewardRepository',
      useClass: ReferralRewardRepositoryImpl,
    },
    BrevoSmsService,
    OtpService,
    AuthJwtService,
    PasswordService,
    JwtStrategy,
    BackblazeService,
    ActivityLoggingService,
    AuthThrottleGuard,
    {
      provide: 'THROTTLER_OPTIONS',
      useValue: {
        ttl: 60,
        limit: 100,
      },
    },
    {
      provide: Env,
      useFactory: (configService: ConfigService) => new Env(configService),
      inject: [ConfigService],
    },
  ],
  exports: [AuthJwtService, 'IAuthRepository', ActivityLoggingService, BackblazeService],
})
export class AuthModule {}