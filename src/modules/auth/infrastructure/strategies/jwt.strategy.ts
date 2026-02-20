import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject('IAuthRepository') private authRepository: IAuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-access-secret',
    });
  }

  async validate(payload: { sub: string; email?: string; role: string; adminSubRole?: string }) {
    const user = await this.authRepository.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email?.getValue(),
      role: user.role,
      adminSubRole: user.adminSubRole,
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified,
      pin: user.pin,
      biometricEnabled: user.biometricEnabled,
      profilePhoto: user.profilePhoto,
      referralCode: user.referralCode,
      notifications: user.notifications,
      location: user.location,   
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
