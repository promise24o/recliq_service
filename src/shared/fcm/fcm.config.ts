import { ConfigService } from '@nestjs/config';

export interface FcmConfig {
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientX509CertUrl: string;
}

export const getFcmConfig = (configService: ConfigService): FcmConfig => ({
  projectId: configService.get<string>('FCM_PROJECT_ID') || '',
  privateKeyId: configService.get<string>('FCM_PRIVATE_KEY_ID') || '',
  privateKey: configService.get<string>('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n') || '',
  clientEmail: configService.get<string>('FCM_CLIENT_EMAIL') || '',
  clientId: configService.get<string>('FCM_CLIENT_ID') || '',
  authUri: configService.get<string>('FCM_AUTH_URI') || 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: configService.get<string>('FCM_TOKEN_URI') || 'https://oauth2.googleapis.com/token',
  authProviderX509CertUrl: configService.get<string>('FCM_AUTH_PROVIDER_X509_CERT_URL') || '',
  clientX509CertUrl: configService.get<string>('FCM_CLIENT_X509_CERT_URL') || '',
});
