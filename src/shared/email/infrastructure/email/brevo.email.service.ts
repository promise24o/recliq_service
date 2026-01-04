import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Env } from '../../../../core/config/env';

@Injectable()
export class BrevoEmailService {
  constructor(private env: Env) {}

  async sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
    const apiKey = this.env.brevoApiKey;
    const sender = this.env.emailSenderAddress;

    // If no API key is configured, log the OTP for development
    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
      console.log('==========================================');
      console.log('🔔 EMAIL SERVICE - DEVELOPMENT MODE');
      console.log('==========================================');
      console.log(`To: ${to}`);
      console.log(`Subject: Your Recliq OTP Code`);
      console.log(`OTP: ${otp}`);
      console.log('==========================================');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Code - Recliq Pro</title>
          <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
              .header { background-color: #ffffff; padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee; }
              .logo { font-size: 24px; font-weight: bold; color: #333333; margin: 0; }
              .content { padding: 40px; color: #333333; line-height: 1.6; }
              .content h2 { font-size: 18px; font-weight: normal; margin: 0 0 20px 0; color: #333333; }
              .content p { margin: 0 0 16px 0; font-size: 16px; }
              .otp { background-color: #f8f9fa; padding: 20px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; color: #28a745; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee; }
              .footer p { margin: 0 0 10px 0; font-size: 12px; color: #666666; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">Recliq Pro</div>
              </div>
              <div class="content">
                  <h2>Hi ${name},</h2>
                  <p>Your OTP code for Recliq Pro is:</p>
                  <div class="otp">${otp}</div>
                  <p>This code expires in 10 minutes. Please do not share it with anyone.</p>
                  <p>If you did not request this code, please ignore this email.</p>
                  <p>Best regards,<br>The Recliq Pro Team ♻️</p>
              </div>
              <div class="footer">
                  <p>© 2024 Recliq Pro. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: sender },
          to: [{ email: to }],
          subject: 'Your Recliq OTP Code',
          htmlContent,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Email sending failed');
    }
  }
}