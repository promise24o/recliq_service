import { ConfigService } from '@nestjs/config';

export class Env {
  constructor(private configService: ConfigService) {}

  get mongodbUri(): string {
    return this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/recliq';
  }

  get jwtAccessSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'default-access-secret';
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret';
  }

  get brevoApiKey(): string {
    return this.configService.get<string>('BREVO_API_KEY') || '';
  }

  get emailSenderAddress(): string {
    return this.configService.get<string>('EMAIL_SENDER_ADDRESS') || 'no-reply@recliq.com';
  }

  get port(): number {
    return this.configService.get<number>('PORT') || 3000;
  }
}