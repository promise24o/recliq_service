import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { Env } from '../../../../core/config/env';

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  templateData?: Record<string, any>;
}

@Injectable()
export class EnhancedBrevoEmailService {
  private readonly logger = new Logger(EnhancedBrevoEmailService.name);
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor(private env: Env) {
    this.initializeSmtpTransporter();
  }

  private initializeSmtpTransporter() {
    if (this.env.emailUser && this.env.emailPassword) {
      this.smtpTransporter = nodemailer.createTransport({
        host: this.env.emailHost,
        port: this.env.emailPort,
        secure: false, // TLS
        auth: {
          user: this.env.emailUser,
          pass: this.env.emailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify SMTP connection
      if (this.smtpTransporter) {
        this.smtpTransporter.verify((error, success) => {
          if (error) {
            this.logger.warn('SMTP connection failed, will use API fallback', error);
            this.smtpTransporter = null;
          } else {
            this.logger.log('SMTP transporter initialized successfully');
          }
        });
      }
    } else {
      this.logger.warn('SMTP credentials not provided, will use API only');
    }
  }

  async sendEmail(emailData: EmailTemplate): Promise<void> {
    const { to, subject, htmlContent } = emailData;

    // Try SMTP first
    if (this.smtpTransporter) {
      try {
        await this.sendViaSmtp(to, subject, htmlContent);
        this.logger.log(`Email sent via SMTP to ${to}`);
        return;
      } catch (error) {
        this.logger.warn(`SMTP failed for ${to}, falling back to API`, error);
      }
    }

    // Fallback to API
    try {
      await this.sendViaApi(to, subject, htmlContent);
      this.logger.log(`Email sent via API to ${to}`);
    } catch (error) {
      this.logger.error(`Both SMTP and API failed for ${to}`, error);
      throw new Error('Email sending failed - all methods exhausted');
    }
  }

  private async sendViaSmtp(to: string, subject: string, htmlContent: string): Promise<void> {
    await this.smtpTransporter!.sendMail({
      from: this.env.emailSenderAddress,
      to,
      subject,
      html: htmlContent,
    });
  }

  private async sendViaApi(to: string, subject: string, htmlContent: string): Promise<void> {
    const apiKey = this.env.brevoApiKey;
    
    // If no API key, log for development
    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
      this.logger.log('==========================================');
      this.logger.log('🔔 EMAIL SERVICE - DEVELOPMENT MODE');
      this.logger.log('==========================================');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log('Content preview:');
      this.logger.log(htmlContent.substring(0, 200) + '...');
      this.logger.log('==========================================');
      return;
    }

    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: this.env.emailSenderAddress, name: this.env.emailUserName },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );
  }

  // Template methods
  async sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
    const template = this.buildOtpTemplate(name, otp);
    await this.sendEmail({
      to,
      subject: 'Your Recliq OTP Code',
      htmlContent: template,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const template = this.buildWelcomeTemplate(name);
    await this.sendEmail({
      to,
      subject: 'Welcome to Recliq Pro!',
      htmlContent: template,
    });
  }

  async sendPasswordResetEmail(to: string, otp: string, name: string): Promise<void> {
    const template = this.buildPasswordResetTemplate(name, otp);
    await this.sendEmail({
      to,
      subject: 'Reset your Recliq password',
      htmlContent: template,
    });
  }

  async sendPinResetEmail(to: string, otp: string, name: string): Promise<void> {
    const template = this.buildPinResetTemplate(name, otp);
    await this.sendEmail({
      to,
      subject: 'Reset your Recliq PIN',
      htmlContent: template,
    });
  }

  async sendLoginNotificationEmail(
    to: string,
    name: string,
    location: string,
    ipAddress: string,
    loginTime: string
  ): Promise<void> {
    const template = this.buildLoginNotificationTemplate(name, location, ipAddress, loginTime);
    await this.sendEmail({
      to,
      subject: 'New Login to Your Recliq Account',
      htmlContent: template,
    });
  }

  async sendBankAccountAddedEmail(
    to: string,
    userName: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
    isDefault: boolean,
    addedAt: string
  ): Promise<void> {
    const template = this.buildBankAccountAddedTemplate(userName, bankName, accountNumber, accountName, isDefault, addedAt);
    await this.sendEmail({
      to,
      subject: 'Bank Account Added Successfully',
      htmlContent: template,
    });
  }

  async sendBankAccountRemovedEmail(
    to: string,
    userName: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
    removedAt: string
  ): Promise<void> {
    const template = this.buildBankAccountRemovedTemplate(userName, bankName, accountNumber, accountName, removedAt);
    await this.sendEmail({
      to,
      subject: 'Bank Account Removed',
      htmlContent: template,
    });
  }

  // Base template builder
  private buildBaseTemplate(title: string, content: string): string {
    const commonStyles = this.getCommonStyles();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
              ${commonStyles}
          </style>
      </head>
      <body>
          <div class="container">
              ${this.buildHeader()}
              <div class="content">
                  ${content}
              </div>
              ${this.buildFooter()}
          </div>
      </body>
      </html>
    `;
  }

  private getCommonStyles(): string {
    return `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        background-color: #f8fafc; 
        margin: 0; 
        padding: 20px; 
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff; 
        border-radius: 12px; 
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
      }
    .header { 
      background: linear-gradient(135deg, #000000 0%, #050214 100%); 
      padding: 20px; 
      text-align: center; 
    }
      .logo { 
        text-align: center; 
        margin: 0; 
      }
      .logo img { 
        width: 100px; 
        height: 100px; 
      }
      .content { 
        padding: 40px; 
        color: #1f2937; 
        line-height: 1.6; 
      }
      .content h2 { 
        font-size: 24px; 
        font-weight: 600; 
        margin: 0 0 20px 0; 
        color: #111827; 
      }
      .content p { 
        margin: 0 0 16px 0; 
        font-size: 16px; 
        color: #4b5563; 
      }
      .footer { 
        background-color: #f9fafb; 
        padding: 30px 40px; 
        text-align: center; 
        border-top: 1px solid #e5e7eb; 
      }
      .footer p { 
        margin: 0 0 8px 0; 
        font-size: 12px; 
        color: #6b7280; 
      }
      .security-notice { 
        background-color: #fef3c7; 
        border-left: 4px solid #f59e0b; 
        padding: 16px; 
        margin: 20px 0; 
        border-radius: 4px; 
      }
      .security-notice p { 
        margin: 0; 
        color: #92400e; 
        font-size: 14px; 
      }
      .button { 
        display: inline-block; 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
        color: #ffffff; 
        padding: 12px 30px; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600; 
        margin: 20px 0; 
      }
    `;
  }

  private buildHeader(): string {
    return `
      <div class="header">
        <div class="logo">
          <img src="https://i.ibb.co/DHvFfXvr/app-icon-white.png" alt="Recliq Pro Logo">
        </div>
      </div>
    `;
  }

  private buildFooter(): string {
    const currentYear = new Date().getFullYear();
    return `
      <div class="footer">
        <p>© ${currentYear} Recliq Pro. All rights reserved.</p>
        <p>Recycling Management Platform</p>
      </div>
    `;
  }

  // Specific template builders
  private buildOtpTemplate(name: string, otp: string): string {
    const content = `
      <h2>Hi ${name},</h2>
      <p>Your verification code for Recliq Pro is ready:</p>
      <div style="border: 2px solid #f8f9fa; padding: 24px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; color: #059669; margin: 24px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      <p>This code will expire in <strong>10 minutes</strong> for your security.</p>
      <div class="security-notice">
        <p>🔒 For your protection, never share this code with anyone. Our team will never ask for your OTP.</p>
      </div>
      <p>If you didn't request this code, please ignore this email or contact our support team.</p>
      <p>Best regards,<br>The  Recliq Pro Team</p>
    `;
    
    return this.buildBaseTemplate('OTP Code - Recliq Pro', content);
  }

  private buildWelcomeTemplate(name: string): string {
    const content = `
      <h2>Welcome to Recliq Pro, ${name}! 🎉</h2>
      <p>Thank you for joining our innovative recycling management platform. We're excited to help you streamline your recycling operations and make a positive environmental impact.</p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #059669; margin-top: 0; margin-bottom: 16px;">What you can do with Recliq Pro:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px; color: #374151;">Track and manage recycling operations efficiently</li>
          <li style="margin-bottom: 8px; color: #374151;">Generate detailed reports and analytics</li>
          <li style="margin-bottom: 8px; color: #374151;">Monitor environmental impact in real-time</li>
          <li style="margin-bottom: 8px; color: #374151;">Collaborate with team members seamlessly</li>
          <li style="margin-bottom: 8px; color: #374151;">Access insights to optimize your recycling processes</li>
        </ul>
      </div>
      
      <p>Get started by exploring your dashboard and setting up your first recycling project.</p>
      <a href="https://recliq.com/dashboard" class="button">Go to Dashboard</a>
      
      <p>If you have any questions, our support team is here to help you every step of the way.</p>
      <p>Best regards,<br>The Recliq Pro Team</p>
    `;
    
    return this.buildBaseTemplate('Welcome to Recliq Pro', content);
  }

  private buildPasswordResetTemplate(name: string, otp: string): string {
    const content = `
      <h2>Reset Your Password, ${name}</h2>
      <p>We received a request to reset your password for your Recliq Pro account. Your password reset code is:</p>
      
      <div style="border: 2px solid #f8f9fa; padding: 24px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; color: #059669; margin: 24px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      
      <p>This code will expire in <strong>10 minutes</strong> for your security.</p>
      
      <div class="security-notice">
        <p>🔒 For your protection, never share this code with anyone. Our team will never ask for your password reset code.</p>
      </div>
      
      <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
      
      <p>Best regards,<br>The Recliq Pro Team</p>
    `;
    
    return this.buildBaseTemplate('Reset Password - Recliq Pro', content);
  }

  private buildLoginNotificationTemplate(name: string, location: string, ipAddress: string, loginTime: string): string {
    const content = `
      <h2>Hi ${name},</h2>
      <p>We detected a new login to your Recliq Pro account. Below are the details of this login:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong>IP Address:</strong> ${ipAddress}</p>
        <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong>Time:</strong> ${loginTime}</p>
      </div>
      
      <p>If this was you, no further action is required. If you did not initiate this login, please take immediate action to secure your account.</p>
      
      <a href="https://recliq.com/dashboard" class="button">Log In to Review Sessions</a>
      
      <p>You can log out unrecognized sessions from your account settings or contact our support team for assistance.</p>
      
      <div class="security-notice">
        <p>🔒 If this wasn't you, please change your password immediately and enable two-factor authentication.</p>
      </div>
      
      <p>Best regards,<br>The Recliq Pro Team</p>
    `;
    
    return this.buildBaseTemplate('Login Notification - Recliq Pro', content);
  }

  private buildPinResetTemplate(name: string, otp: string): string {
    const content = `
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your PIN for your Recliq account. Your PIN reset code is:</p>
      <div style="border: 2px solid #f8f9fa; padding: 24px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: bold; color: #059669; margin: 24px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      <p>This code will expire in <strong>10 minutes</strong> for your security.</p>
      <div class="security-notice">
        <p>🔒 For your protection, never share this code with anyone. Our team will never ask for your PIN reset code.</p>
      </div>
      <p>If you didn't request this PIN reset, please ignore this email or contact our support team immediately.</p>
      <p>Best regards,<br>The Recliq Team</p>
    `;
    
    return this.buildBaseTemplate('PIN Reset Code - Recliq', content);
  }

  private buildBankAccountAddedTemplate(
    userName: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
    isDefault: boolean,
    addedAt: string
  ): string {
    const maskedAccountNumber = this.maskAccountNumber(accountNumber);
    const defaultBadge = isDefault ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">DEFAULT ACCOUNT</span>' : '';
    
    const content = `
      <h2>Hi ${userName},</h2>
      <p>Great news! Your bank account has been successfully added to your wallet.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #059669; margin-top: 0; margin-bottom: 16px;">Bank Account Details</h3>
        <p style="margin: 8px 0; color: #374151;"><strong>Bank Name:</strong> ${bankName}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Account Name:</strong> ${accountName}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Account Number:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${maskedAccountNumber}</span></p>
        ${defaultBadge ? `<p style="margin-top: 12px;">${defaultBadge}</p>` : ''}
      </div>
      
      <p>You can now use this bank account for withdrawals and other transactions through your wallet.</p>
      
      <p><strong>Added on:</strong> ${new Date(addedAt).toLocaleDateString()} at ${new Date(addedAt).toLocaleTimeString()}</p>
      
      <p>If you didn't add this bank account or have any questions, please contact our support team immediately.</p>
      
      <p>Best regards,<br>The Recliq Team</p>
    `;
    
    return this.buildBaseTemplate('Bank Account Added Successfully', content);
  }

  private buildBankAccountRemovedTemplate(
    userName: string,
    bankName: string,
    accountNumber: string,
    accountName: string,
    removedAt: string
  ): string {
    const maskedAccountNumber = this.maskAccountNumber(accountNumber);
    
    const content = `
      <h2>Hi ${userName},</h2>
      <p>This is to confirm that your bank account has been successfully removed from your wallet.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px;">Removed Bank Account Details</h3>
        <p style="margin: 8px 0; color: #374151;"><strong>Bank Name:</strong> ${bankName}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Account Name:</strong> ${accountName}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Account Number:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${maskedAccountNumber}</span></p>
      </div>
      
      <div class="security-notice">
        <p><strong>Important:</strong> This bank account can no longer be used for withdrawals or other transactions through your wallet. If you need to use it again, you will need to add it back to your wallet.</p>
      </div>
      
      <p><strong>Removed on:</strong> ${new Date(removedAt).toLocaleDateString()} at ${new Date(removedAt).toLocaleTimeString()}</p>
      
      <p>If you didn't remove this bank account or have any concerns about this action, please contact our support team immediately.</p>
      
      <p>Best regards,<br>The Recliq Team</p>
    `;
    
    return this.buildBaseTemplate('Bank Account Removed', content);
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    const start = accountNumber.substring(0, 2);
    const end = accountNumber.substring(accountNumber.length - 4);
    const middle = '*'.repeat(accountNumber.length - 6);
    return `${start}${middle}${end}`;
  }
}
