import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';

@Injectable()
export class GetNotificationPreferencesUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(adminId: string) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Get user's notification preferences from the user entity
    const userPrefs = admin.notifications || { priceUpdates: false, loginEmails: false };

    // Return comprehensive notification preferences
    const preferences = [
      {
        id: 'NP-001',
        category: 'Security',
        label: 'Login Alerts',
        description: 'Notify on new login from unrecognized device',
        email: userPrefs.loginEmails,
        inApp: true,
        forced: true,
      },
      {
        id: 'NP-002',
        category: 'Security',
        label: 'Password Changes',
        description: 'Notify when password is changed',
        email: true,
        inApp: true,
        forced: true,
      },
      {
        id: 'NP-003',
        category: 'Security',
        label: 'Failed Login Attempts',
        description: 'Alert on multiple failed login attempts',
        email: true,
        inApp: true,
        forced: true,
      },
      {
        id: 'NP-004',
        category: 'Operations',
        label: 'Pickup Escalations',
        description: 'Notify on SLA breaches or pickup failures',
        email: true,
        inApp: true,
        forced: false,
      },
      {
        id: 'NP-005',
        category: 'Operations',
        label: 'Agent Status Changes',
        description: 'Notify when agents go offline or are deactivated',
        email: false,
        inApp: true,
        forced: false,
      },
      {
        id: 'NP-006',
        category: 'Finance',
        label: 'Payment Approvals',
        description: 'Notify on pending payment approvals',
        email: true,
        inApp: true,
        forced: false,
      },
      {
        id: 'NP-007',
        category: 'Finance',
        label: 'Float Alerts',
        description: 'Notify when wallet float drops below threshold',
        email: true,
        inApp: true,
        forced: false,
      },
      {
        id: 'NP-008',
        category: 'System',
        label: 'System Updates',
        description: 'Notify on platform updates and maintenance',
        email: false,
        inApp: true,
        forced: false,
      },
    ];

    return preferences;
  }
}
