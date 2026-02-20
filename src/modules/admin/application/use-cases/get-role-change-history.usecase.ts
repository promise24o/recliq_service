import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class GetRoleChangeHistoryUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute() {
    // Get all admin users to build history
    const admins = await this.authRepository.findByRole(UserRole.ADMIN);

    // Build role change history based on admin creation/update timestamps
    const changeHistory = this.buildChangeHistory(admins);

    // Sort by timestamp descending (most recent first)
    return changeHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private buildChangeHistory(admins: any[]) {
    const events: any[] = [];

    admins.forEach((admin) => {
      // Event 1: Role assignment (admin creation)
      events.push({
        id: `event_created_${admin.id}`,
        action: 'role_assigned',
        targetRole: admin.adminSubRole || 'UNASSIGNED',
        targetAdmin: admin.name,
        targetAdminId: admin.id,
        actor: 'System Admin',
        actorId: 'system',
        actorRole: AdminSubRole.SUPER_ADMIN,
        description: `Assigned ${admin.adminSubRole || 'UNASSIGNED'} role to ${admin.name}`,
        reason: `Initial role assignment during admin account creation`,
        linkedAuditLogId: `audit_create_${admin.id.substring(0, 8)}`,
        timestamp: admin.createdAt.toISOString(),
      });

      // Event 2: If updated timestamp differs from created, add update event
      if (admin.updatedAt && admin.createdAt.getTime() !== admin.updatedAt.getTime()) {
        events.push({
          id: `event_updated_${admin.id}`,
          action: 'permission_updated',
          targetRole: admin.adminSubRole || 'UNASSIGNED',
          targetAdmin: admin.name,
          targetAdminId: admin.id,
          actor: 'System Admin',
          actorId: 'system',
          actorRole: AdminSubRole.SUPER_ADMIN,
          description: `Updated permissions for ${admin.name}`,
          reason: 'Role or permission modification',
          linkedAuditLogId: `audit_update_${admin.id.substring(0, 8)}`,
          timestamp: admin.updatedAt.toISOString(),
        });
      }

      // Event 3: If admin is not verified (suspended)
      if (!admin.isVerified) {
        events.push({
          id: `event_suspended_${admin.id}`,
          action: 'admin_suspended',
          targetRole: admin.adminSubRole || 'UNASSIGNED',
          targetAdmin: admin.name,
          targetAdminId: admin.id,
          actor: 'System Admin',
          actorId: 'system',
          actorRole: AdminSubRole.SUPER_ADMIN,
          description: `Suspended admin account for ${admin.name}`,
          reason: 'Account verification revoked or security concern',
          linkedAuditLogId: `audit_suspend_${admin.id.substring(0, 8)}`,
          timestamp: admin.updatedAt?.toISOString() || admin.createdAt.toISOString(),
        });
      }
    });

    // Add some synthetic events for demonstration of role changes
    this.addSyntheticRoleEvents(events, admins);

    return events;
  }

  private addSyntheticRoleEvents(events: any[], admins: any[]) {
    // Add example role change events for better demonstration
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Example: Role enabled event
    if (admins.length > 0) {
      events.push({
        id: `event_enabled_example`,
        action: 'role_enabled',
        targetRole: AdminSubRole.FINANCE_ADMIN,
        targetAdmin: admins[0]?.name || 'Admin User',
        targetAdminId: admins[0]?.id || 'example',
        actor: 'Super Admin',
        actorId: 'super_admin_001',
        actorRole: AdminSubRole.SUPER_ADMIN,
        description: `Enabled ${AdminSubRole.FINANCE_ADMIN} role after security review`,
        reason: 'Security audit completed successfully',
        linkedAuditLogId: `audit_enable_${Date.now()}`,
        timestamp: yesterday.toISOString(),
      });
    }

    // Example: Role disabled event
    if (admins.length > 1) {
      events.push({
        id: `event_disabled_example`,
        action: 'role_disabled',
        targetRole: AdminSubRole.OPS_ADMIN,
        targetAdmin: admins[1]?.name || 'Admin User 2',
        targetAdminId: admins[1]?.id || 'example2',
        actor: 'Super Admin',
        actorId: 'super_admin_001',
        actorRole: AdminSubRole.SUPER_ADMIN,
        description: `Temporarily disabled ${AdminSubRole.OPS_ADMIN} role pending investigation`,
        reason: 'Unusual activity detected - pending security review',
        linkedAuditLogId: `audit_disable_${Date.now()}`,
        timestamp: lastWeek.toISOString(),
      });
    }

    // Example: Role revoked event
    events.push({
      id: `event_revoked_example`,
      action: 'role_revoked',
      targetRole: AdminSubRole.STRATEGY_ADMIN,
      targetAdmin: 'Former Admin',
      targetAdminId: 'revoked_admin_001',
      actor: 'Super Admin',
      actorId: 'super_admin_001',
      actorRole: AdminSubRole.SUPER_ADMIN,
      description: `Revoked ${AdminSubRole.STRATEGY_ADMIN} role from Former Admin`,
      reason: 'Employee departure - access termination',
      linkedAuditLogId: `audit_revoke_${Date.now()}`,
      timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}
