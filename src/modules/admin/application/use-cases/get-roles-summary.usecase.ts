import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class GetRolesSummaryUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute() {
    // Get all admin users
    const admins = await this.authRepository.findByRole(UserRole.ADMIN);

    // Calculate total roles (4 admin sub-roles)
    const totalRoles = Object.keys(AdminSubRole).length;

    // Count admins assigned
    const adminsAssigned = admins.length;

    // Count high-privilege roles (SUPER_ADMIN)
    const highPrivilegeRoles = admins.filter(
      admin => admin.adminSubRole === AdminSubRole.SUPER_ADMIN
    ).length;

    // Count approval-required actions (based on role permissions)
    // Finance operations typically require approval
    const approvalRequiredActions = this.calculateApprovalRequiredActions();

    // Check for permission conflicts (overlapping scopes)
    const permissionConflicts = this.detectPermissionConflicts(admins);

    // Get last role change (most recent admin creation/update)
    const lastRoleChange = admins.length > 0
      ? admins.reduce((latest, admin) => {
          const adminDate = new Date(admin.updatedAt);
          return adminDate > latest ? adminDate : latest;
        }, new Date(admins[0].updatedAt))
      : null;

    return {
      totalRoles,
      adminsAssigned,
      highPrivilegeRoles,
      approvalRequiredActions,
      permissionConflicts,
      lastRoleChange: lastRoleChange?.toISOString(),
    };
  }

  private calculateApprovalRequiredActions(): number {
    // Define critical actions that require approval
    const criticalActions = [
      'withdraw_funds',
      'approve_withdrawal',
      'modify_user_balance',
      'delete_user',
      'change_admin_role',
      'system_configuration',
      'bulk_operations',
      'financial_reports',
    ];
    
    return criticalActions.length;
  }

  private detectPermissionConflicts(admins: any[]): number {
    // Check for potential conflicts:
    // 1. Multiple SUPER_ADMINs (not a conflict but worth tracking)
    // 2. Overlapping finance permissions
    // 3. Duplicate role assignments
    
    let conflicts = 0;
    
    // Group admins by role
    const roleGroups = admins.reduce((groups, admin) => {
      const role = admin.adminSubRole || 'UNASSIGNED';
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(admin);
      return groups;
    }, {} as Record<string, any[]>);

    // Check for potential issues
    // Multiple SUPER_ADMINs might indicate over-privileged access
    const superAdminCount = roleGroups[AdminSubRole.SUPER_ADMIN]?.length || 0;
    if (superAdminCount > 3) {
      conflicts += 1; // Too many super admins
    }

    // Check for admins without assigned sub-roles
    if (roleGroups['UNASSIGNED']?.length > 0) {
      conflicts += roleGroups['UNASSIGNED'].length;
    }

    return conflicts;
  }
}
