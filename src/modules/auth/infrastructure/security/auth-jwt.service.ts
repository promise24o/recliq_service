import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Env } from '../../../../core/config/env';

@Injectable()
export class AuthJwtService {
  constructor(
    private nestJwtService: NestJwtService,
    private env: Env,
  ) {}

  generateAccessToken(payload: any): string {
    return this.nestJwtService.sign(payload, {
      secret: this.env.jwtAccessSecret,
      expiresIn: '7d',
    });
  }

  generateRefreshToken(payload: any): string {
    return this.nestJwtService.sign(payload, {
      secret: this.env.jwtRefreshSecret,
      expiresIn: '7d',
    });
  }

  verifyRefreshToken(token: string): any {
    return this.nestJwtService.verify(token, {
      secret: this.env.jwtRefreshSecret,
    });
  }
}