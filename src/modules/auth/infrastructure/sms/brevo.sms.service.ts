import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Env } from '../../../../core/config/env';

export interface SmsTemplate {
  to: string;
  message: string;
  type?: 'transactional' | 'marketing';
}

@Injectable()
export class BrevoSmsService {
  private readonly logger = new Logger(BrevoSmsService.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/transactionalSMS/sms';

  constructor(private env: Env) {}

  async sendSms(smsData: SmsTemplate): Promise<void> {
    const { to, message, type = 'transactional' } = smsData;
    const apiKey = this.env.brevoApiKey;

    // If no API key, log for development
    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
      this.logger.log('==========================================');
      this.logger.log('📱 SMS SERVICE - DEVELOPMENT MODE');
      this.logger.log('==========================================');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Type: ${type}`);
      this.logger.log(`Message: ${message}`);
      this.logger.log('==========================================');
      return;
    }

    try {
      await axios.post(
        this.apiUrl,
        {
          recipient: to,
          content: message,
          type,
          sender: 'Recliq',
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw new Error('SMS sending failed');
    }
  }

  // Template methods
  async sendOtpSms(to: string, otp: string, name?: string): Promise<void> {
    const message = this.getOtpSmsTemplate(otp, name);
    await this.sendSms({
      to,
      message,
      type: 'transactional',
    });
  }

  async sendWelcomeSms(to: string, name: string): Promise<void> {
    const message = this.getWelcomeSmsTemplate(name);
    await this.sendSms({
      to,
      message,
      type: 'transactional',
    });
  }

  async sendVerificationSms(to: string, verificationCode: string): Promise<void> {
    const message = this.getVerificationSmsTemplate(verificationCode);
    await this.sendSms({
      to,
      message,
      type: 'transactional',
    });
  }

  private getOtpSmsTemplate(otp: string, name?: string): string {
    const greeting = name ? `Hi ${name}, ` : '';
    return `${greeting}Your Recliq Pro verification code is: ${otp}. Valid for 10 minutes. Don't share this code with anyone. ♻️`;
  }

  private getWelcomeSmsTemplate(name: string): string {
    return `Welcome to Recliq Pro, ${name}! 🎉 Your account is ready. Start managing your recycling operations efficiently. Visit: recliq.com ♻️`;
  }

  private getVerificationSmsTemplate(verificationCode: string): string {
    return `Your Recliq Pro verification code is: ${verificationCode}. Enter this code to complete your verification. Valid for 10 minutes. ♻️`;
  }
}
