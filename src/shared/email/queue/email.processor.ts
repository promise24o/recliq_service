import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { EnhancedBrevoEmailService } from '../infrastructure/email/enhanced-brevo.email.service';
import { EmailJobData } from './email-job.interface';

@Processor('email')
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private enhancedBrevoEmailService: EnhancedBrevoEmailService) {}

  @Process('send-email')
  async handleEmail(job: Job<EmailJobData>) {
    const { to, subject, template, payload } = job.data;

    this.logger.log(`Processing email job ${job.id} to ${to}`);

    try {
      // Handle different email templates
      if (template === 'otp') {
        await this.enhancedBrevoEmailService.sendOtpEmail(to, payload.otp, payload.name);
      } else if (template === 'password-reset') {
        await this.enhancedBrevoEmailService.sendPasswordResetEmail(to, payload.otp, payload.name);
      } else if (template === 'pin-reset') {
        await this.enhancedBrevoEmailService.sendPinResetEmail(to, payload.otp, payload.name);
      } else if (template === 'login-notification') {
        await this.enhancedBrevoEmailService.sendLoginNotificationEmail(
          to, 
          payload.name, 
          payload.location, 
          payload.ipAddress, 
          payload.loginTime
        );
      } else if (template === 'bank-account-added') {
        await this.enhancedBrevoEmailService.sendBankAccountAddedEmail(
          to,
          payload.userName,
          payload.bankName,
          payload.accountNumber,
          payload.accountName,
          payload.isDefault,
          payload.addedAt
        );
      } else if (template === 'bank-account-removed') {
        await this.enhancedBrevoEmailService.sendBankAccountRemovedEmail(
          to,
          payload.userName,
          payload.bankName,
          payload.accountNumber,
          payload.accountName,
          payload.removedAt
        );
      } else if (template === 'admin-welcome') {
        await this.enhancedBrevoEmailService.sendAdminWelcomeEmail(
          to,
          payload.name,
          payload.email,
          payload.password,
          payload.adminSubRole
        );
      } else {
        // Handle unknown templates
        this.logger.warn(`Unknown template: ${template}`);
      }

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<EmailJobData>, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }
}