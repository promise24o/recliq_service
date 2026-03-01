import { Injectable, Inject } from '@nestjs/common';
import { EmailQueueService } from '../../../../shared/email/queue/email-queue.service';
import { EmailJobData, EmailPriority } from '../../../../shared/email/queue/email-job.interface';
import { VehicleStatus, DocumentStatus, DocumentType } from '../../domain/constants/vehicle.constants';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import { Notification } from '../../../notifications/domain/entities/notification.entity';
import { NotificationType, NotificationCategory, NotificationPriority } from '../../../notifications/domain/enums/notification-type.enum';

export interface VehicleStatusChangeData {
  userId: string;
  vehicleId: string;
  plateNumber: string;
  oldStatus: VehicleStatus;
  newStatus: VehicleStatus;
  rejectionReason?: string;
  approvedBy?: string;
}

export interface DocumentStatusChangeData {
  userId: string;
  vehicleId: string;
  plateNumber: string;
  documentType: DocumentType;
  oldStatus: DocumentStatus;
  newStatus: DocumentStatus;
  rejectionReason?: string;
  verifiedBy?: string;
}

@Injectable()
export class VehicleNotificationService {
  constructor(
    private readonly emailQueueService: EmailQueueService,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    @Inject('INotificationRepository')
    private readonly notificationRepository: any,
  ) {}

  async notifyVehicleStatusChange(data: VehicleStatusChangeData): Promise<void> {
    const { userId, vehicleId, plateNumber, oldStatus, newStatus, rejectionReason, approvedBy } = data;

    // Fetch user to get email
    const user = await this.userRepository.findById(userId);
    if (!user || !user.email) {
      console.warn(`User not found or no email for userId: ${userId}`);
      return;
    }

    // Queue email notification
    const emailSubject = this.getVehicleStatusNotificationTitle(newStatus);
    const emailContent = this.getVehicleStatusEmailContent(newStatus, plateNumber, rejectionReason);

    const emailJob: EmailJobData = {
      to: user.email,
      subject: emailSubject,
      template: 'vehicle-status-change',
      payload: {
        userName: user.name,
        plateNumber,
        oldStatus,
        newStatus,
        rejectionReason,
        approvedBy
      },
      priority: EmailPriority.MEDIUM,
      idempotencyKey: `vehicle-status-${vehicleId}-${newStatus}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date()
    };

    await this.emailQueueService.addEmailJob(emailJob);
    
    // Create in-app notification
    await this.createVehicleStatusNotification(userId, newStatus, plateNumber, vehicleId, rejectionReason);
  }

  async notifyDocumentStatusChange(data: DocumentStatusChangeData): Promise<void> {
    const { userId, vehicleId, plateNumber, documentType, oldStatus, newStatus, rejectionReason, verifiedBy } = data;

    // Fetch user to get email
    const user = await this.userRepository.findById(userId);
    if (!user || !user.email) {
      console.warn(`User not found or no email for userId: ${userId}`);
      return;
    }

    // Queue email notification
    const emailSubject = this.getDocumentStatusNotificationTitle(newStatus, documentType);
    const emailContent = this.getDocumentStatusEmailContent(newStatus, documentType, plateNumber, rejectionReason);

    const emailJob: EmailJobData = {
      to: user.email,
      subject: emailSubject,
      template: 'document-status-change',
      payload: {
        userName: user.name,
        plateNumber,
        documentType,
        documentName: this.getDocumentDisplayName(documentType),
        oldStatus,
        newStatus,
        rejectionReason,
        verifiedBy
      },
      priority: EmailPriority.MEDIUM,
      idempotencyKey: `document-status-${vehicleId}-${documentType}-${newStatus}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date()
    };

    await this.emailQueueService.addEmailJob(emailJob);
    
    // Create in-app notification
    await this.createDocumentStatusNotification(userId, newStatus, documentType, plateNumber, vehicleId, rejectionReason);
  }

  private async createVehicleStatusNotification(
    userId: string,
    status: VehicleStatus,
    plateNumber: string,
    vehicleId: string,
    rejectionReason?: string
  ): Promise<void> {
    const notificationType = this.getVehicleNotificationType(status);
    const { title, message } = this.getVehicleNotificationContent(status, plateNumber, rejectionReason);
    
    const notification = Notification.create({
      userId,
      type: notificationType,
      category: NotificationCategory.VEHICLE,
      title,
      message,
      priority: status === VehicleStatus.APPROVED ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      actionUrl: `/vehicles/${vehicleId}`,
      actionText: 'View Vehicle',
      metadata: {
        vehicleId,
        plateNumber,
        status,
        rejectionReason
      }
    });

    await this.notificationRepository.create(notification);
  }

  private async createDocumentStatusNotification(
    userId: string,
    status: DocumentStatus,
    documentType: DocumentType,
    plateNumber: string,
    vehicleId: string,
    rejectionReason?: string
  ): Promise<void> {
    const notificationType = this.getDocumentNotificationType(status);
    const documentName = this.getDocumentDisplayName(documentType);
    const { title, message } = this.getDocumentNotificationContent(status, documentName, plateNumber, rejectionReason);
    
    const notification = Notification.create({
      userId,
      type: notificationType,
      category: NotificationCategory.VEHICLE,
      title,
      message,
      priority: status === DocumentStatus.VERIFIED ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      actionUrl: `/vehicles/${vehicleId}`,
      actionText: 'View Documents',
      metadata: {
        vehicleId,
        plateNumber,
        documentType,
        documentName,
        status,
        rejectionReason
      }
    });

    await this.notificationRepository.create(notification);
  }

  private getVehicleNotificationType(status: VehicleStatus): NotificationType {
    switch (status) {
      case VehicleStatus.APPROVED:
        return NotificationType.VEHICLE_APPROVED;
      case VehicleStatus.REJECTED:
        return NotificationType.VEHICLE_REJECTED;
      case VehicleStatus.UNDER_REVIEW:
        return NotificationType.VEHICLE_UNDER_REVIEW;
      default:
        return NotificationType.VEHICLE_STATUS_CHANGED;
    }
  }

  private getDocumentNotificationType(status: DocumentStatus): NotificationType {
    switch (status) {
      case DocumentStatus.VERIFIED:
        return NotificationType.DOCUMENT_VERIFIED;
      case DocumentStatus.REJECTED:
        return NotificationType.DOCUMENT_REJECTED;
      default:
        return NotificationType.VEHICLE_STATUS_CHANGED;
    }
  }

  private getVehicleNotificationContent(status: VehicleStatus, plateNumber: string, rejectionReason?: string): { title: string; message: string } {
    switch (status) {
      case VehicleStatus.APPROVED:
        return {
          title: 'Vehicle Approved! 🎉',
          message: `Your vehicle ${plateNumber} has been approved and is now active. Start accepting jobs now!`
        };
      case VehicleStatus.REJECTED:
        return {
          title: 'Vehicle Application Rejected',
          message: `Your vehicle application for ${plateNumber} has been rejected${rejectionReason ? ': ' + rejectionReason : '.'}`
        };
      case VehicleStatus.UNDER_REVIEW:
        return {
          title: 'Vehicle Under Review',
          message: `Your vehicle ${plateNumber} is currently under review.`
        };
      default:
        return {
          title: 'Vehicle Status Updated',
          message: `Your vehicle ${plateNumber} status has been updated.`
        };
    }
  }

  private getDocumentNotificationContent(status: DocumentStatus, documentName: string, plateNumber: string, rejectionReason?: string): { title: string; message: string } {
    switch (status) {
      case DocumentStatus.VERIFIED:
        return {
          title: `${documentName} Verified! ✅`,
          message: `Your ${documentName} for vehicle ${plateNumber} has been verified successfully.`
        };
      case DocumentStatus.REJECTED:
        return {
          title: `${documentName} Rejected`,
          message: `Your ${documentName} for vehicle ${plateNumber} has been rejected${rejectionReason ? ': ' + rejectionReason : '.'}`
        };
      default:
        return {
          title: 'Document Status Updated',
          message: `Your ${documentName} status has been updated.`
        };
    }
  }

  private getVehicleStatusNotificationTitle(status: VehicleStatus): string {
    switch (status) {
      case VehicleStatus.APPROVED:
        return 'Vehicle Approved! 🎉';
      case VehicleStatus.REJECTED:
        return 'Vehicle Application Rejected';
      case VehicleStatus.UNDER_REVIEW:
        return 'Vehicle Under Review';
      case VehicleStatus.ACTIVE:
        return 'Vehicle Activated';
      case VehicleStatus.INACTIVE:
        return 'Vehicle Deactivated';
      case VehicleStatus.UNDER_MAINTENANCE:
        return 'Vehicle Under Maintenance';
      case VehicleStatus.TEMPORARILY_UNAVAILABLE:
        return 'Vehicle Temporarily Unavailable';
      default:
        return 'Vehicle Status Updated';
    }
  }

  private getVehicleStatusNotificationMessage(status: VehicleStatus, plateNumber: string, rejectionReason?: string): string {
    switch (status) {
      case VehicleStatus.APPROVED:
        return `Your vehicle (${plateNumber}) has been approved and is now active!`;
      case VehicleStatus.REJECTED:
        return `Your vehicle (${plateNumber}) application has been rejected${rejectionReason ? ': ' + rejectionReason : '.'}`;
      case VehicleStatus.UNDER_REVIEW:
        return `Your vehicle (${plateNumber}) is currently under review.`;
      case VehicleStatus.ACTIVE:
        return `Your vehicle (${plateNumber}) has been activated.`;
      case VehicleStatus.INACTIVE:
        return `Your vehicle (${plateNumber}) has been deactivated.`;
      case VehicleStatus.UNDER_MAINTENANCE:
        return `Your vehicle (${plateNumber}) is now under maintenance.`;
      case VehicleStatus.TEMPORARILY_UNAVAILABLE:
        return `Your vehicle (${plateNumber}) is temporarily unavailable.`;
      default:
        return `Your vehicle (${plateNumber}) status has been updated.`;
    }
  }

  private getDocumentStatusNotificationTitle(status: DocumentStatus, documentType: DocumentType): string {
    const documentName = this.getDocumentDisplayName(documentType);
    switch (status) {
      case DocumentStatus.VERIFIED:
        return `${documentName} Verified! ✅`;
      case DocumentStatus.REJECTED:
        return `${documentName} Rejected`;
      default:
        return `${documentName} Status Updated`;
    }
  }

  private getDocumentStatusNotificationMessage(status: DocumentStatus, documentType: DocumentType, rejectionReason?: string): string {
    const documentName = this.getDocumentDisplayName(documentType);
    switch (status) {
      case DocumentStatus.VERIFIED:
        return `Your ${documentName} has been verified successfully!`;
      case DocumentStatus.REJECTED:
        return `Your ${documentName} has been rejected${rejectionReason ? ': ' + rejectionReason : '.'}`;
      default:
        return `Your ${documentName} status has been updated.`;
    }
  }

  private getVehicleStatusEmailContent(status: VehicleStatus, plateNumber: string, rejectionReason?: string): string {
    switch (status) {
      case VehicleStatus.APPROVED:
        return `
          <h2>Vehicle Approved! 🎉</h2>
          <p>Congratulations! Your vehicle <strong>${plateNumber}</strong> has been approved and is now active.</p>
          <p>You can now start accepting recycling jobs through the platform.</p>
          <p>Thank you for joining Recliq!</p>
        `;
      case VehicleStatus.REJECTED:
        return `
          <h2>Vehicle Application Rejected</h2>
          <p>We're sorry to inform you that your vehicle application for <strong>${plateNumber}</strong> has been rejected.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Please review the requirements and submit a new application if needed.</p>
        `;
      default:
        return `
          <h2>Vehicle Status Updated</h2>
          <p>Your vehicle <strong>${plateNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
        `;
    }
  }

  private getDocumentStatusEmailContent(status: DocumentStatus, documentType: DocumentType, plateNumber: string, rejectionReason?: string): string {
    const documentName = this.getDocumentDisplayName(documentType);
    switch (status) {
      case DocumentStatus.VERIFIED:
        return `
          <h2>${documentName} Verified! ✅</h2>
          <p>Your ${documentName} for vehicle <strong>${plateNumber}</strong> has been verified successfully.</p>
          <p>This brings you one step closer to getting your vehicle approved.</p>
        `;
      case DocumentStatus.REJECTED:
        return `
          <h2>${documentName} Rejected</h2>
          <p>Your ${documentName} for vehicle <strong>${plateNumber}</strong> has been rejected.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Please upload a valid document and try again.</p>
        `;
      default:
        return `
          <h2>Document Status Updated</h2>
          <p>Your ${documentName} status has been updated to <strong>${status}</strong>.</p>
        `;
    }
  }

  private getDocumentDisplayName(documentType: DocumentType): string {
    switch (documentType) {
      case DocumentType.REGISTRATION:
        return 'Vehicle Registration';
      case DocumentType.INSURANCE:
        return 'Insurance';
      case DocumentType.ROADWORTHINESS:
        return 'Roadworthiness Certificate';
      case DocumentType.INSPECTION_CERTIFICATE:
        return 'Inspection Certificate';
      default:
        return documentType;
    }
  }
}
