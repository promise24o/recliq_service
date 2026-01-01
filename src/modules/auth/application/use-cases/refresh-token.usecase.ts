import { Injectable } from '@nestjs/common';
import { AuthJwtService } from '../../infrastructure/security/auth-jwt.service';
import { UnauthorizedException } from '../../../../core/exceptions/unauthorized.exception';

export interface RefreshTokenInput {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(private jwtService: AuthJwtService) {}

  async execute(input: RefreshTokenInput): Promise<{ accessToken: string }> {
    const { refreshToken } = input;

    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);
      const newAccessToken = this.jwtService.generateAccessToken({
        sub: payload.sub,
        role: payload.role,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}