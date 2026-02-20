import { Injectable, Inject } from '@nestjs/common';
import { Request } from 'express';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { Phone } from '../../../auth/domain/value-objects/phone.vo';
import { BackblazeService } from '../../../auth/infrastructure/storage/backblaze.service';
import { ActivityLoggingService } from '../../../auth/domain/services/activity-logging.service';
import { UpdateAdminProfileDto } from '../../presentation/dto/update-admin-profile.dto';

@Injectable()
export class UpdateAdminProfileUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly backblazeService: BackblazeService,
    private readonly activityLoggingService: ActivityLoggingService,
  ) {}

  async execute(adminId: string, updateData: UpdateAdminProfileDto, photoFile?: Express.Multer.File, request?: Request) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const changes: Record<string, any> = {};

    // Update phone number
    if (updateData.phone) {
      const oldPhone = admin.phone?.getValue() || '';
      admin.phone = Phone.create(updateData.phone);
      changes.phone = { from: oldPhone, to: updateData.phone };
    }

    // Handle photo upload if provided
    if (photoFile) {
      const oldPhoto = admin.profilePhoto || '';
      // Upload to Backblaze and get the public URL
      const photoUrl = await this.backblazeService.uploadProfilePhoto(
        adminId,
        photoFile.buffer,
        photoFile.mimetype,
        photoFile.originalname
      );
      admin.profilePhoto = photoUrl;
      changes.profilePhoto = { from: oldPhoto, to: photoUrl };
    }

    const updatedAdmin = await this.authRepository.update(admin);

    // Log activity if there were changes
    if (Object.keys(changes).length > 0) {
      await this.activityLoggingService.logProfileUpdate(admin, changes, request);
    }

    // Extract name from the user entity
    const nameParts = updatedAdmin.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: updatedAdmin.id,
      firstName,
      lastName,
      email: updatedAdmin.email?.getValue() || '',
      phone: updatedAdmin.phone?.getValue() || '',
      avatar: updatedAdmin.profilePhoto,
      role: updatedAdmin.adminSubRole || 'NO_ROLE',
      accountStatus: updatedAdmin.isVerified ? 'active' : 'suspended',
      department: 'Platform Operations', // Default department
      joinedAt: updatedAdmin.createdAt.toISOString(),
      lastLogin: updatedAdmin.updatedAt.toISOString(),
    };
  }
}
