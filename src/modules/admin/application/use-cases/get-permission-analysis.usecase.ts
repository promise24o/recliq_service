import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole, ADMIN_PERMISSIONS } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class GetPermissionAnalysisUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute() {
    // Get all admin users
    const admins = await this.authRepository.findByRole(UserRole.ADMIN);

    // Analyze conflicts
    const conflicts = this.analyzeConflicts(admins);

    // Build permission matrix
    const permissionMatrix = this.buildPermissionMatrix();

    return {
      conflicts,
      permissionMatrix,
    };
  }

  private analyzeConflicts(admins: any[]) {
    const conflicts: any[] = [];

    // Group admins by role
    const roleGroups = admins.reduce((groups, admin) => {
      const role = admin.adminSubRole || 'UNASSIGNED';
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(admin);
      return groups;
    }, {} as Record<string, any[]>);

    // Conflict 1: Too many SUPER_ADMINs (Excess Privilege)
    const superAdminCount = roleGroups[AdminSubRole.SUPER_ADMIN]?.length || 0;
    if (superAdminCount > 2) {
      conflicts.push({
        id: `conflict_super_admin_excess`,
        type: 'excess_privilege',
        severity: 'critical',
        description: `${superAdminCount} SUPER_ADMIN roles detected - violates least privilege principle`,
        affectedRoles: [AdminSubRole.SUPER_ADMIN],
        recommendation: 'Limit SUPER_ADMIN assignments to maximum 2 users and audit regularly',
        detectedAt: new Date().toISOString(),
      });
    }

    // Conflict 2: Unassigned admin roles (Segregation Violation)
    if (roleGroups['UNASSIGNED']?.length > 0) {
      conflicts.push({
        id: `conflict_unassigned_roles`,
        type: 'segregation_violation',
        severity: 'warning',
        description: `${roleGroups['UNASSIGNED'].length} admin(s) without assigned sub-roles - unclear permission boundaries`,
        affectedRoles: ['UNASSIGNED'],
        recommendation: 'Assign specific sub-roles to all admin users to enforce segregation of duties',
        detectedAt: new Date().toISOString(),
      });
    }

    // Conflict 3: Finance + Operations overlap (Conflicting Scope)
    const financeAdmins = roleGroups[AdminSubRole.FINANCE_ADMIN]?.length || 0;
    const opsAdmins = roleGroups[AdminSubRole.OPS_ADMIN]?.length || 0;
    
    if (financeAdmins > 0 && opsAdmins > 0) {
      // Check if any user has both finance and ops capabilities (shouldn't happen with current design)
      // This is more of a theoretical check for future role combinations
      const hasOverlap = this.checkRoleOverlap(
        ADMIN_PERMISSIONS[AdminSubRole.FINANCE_ADMIN],
        ADMIN_PERMISSIONS[AdminSubRole.OPS_ADMIN]
      );
      
      if (!hasOverlap) {
        // Good - no overlap, but we can still provide info
        conflicts.push({
          id: `conflict_finance_ops_separation`,
          type: 'segregation_violation',
          severity: 'info',
          description: 'Finance and Operations roles are properly segregated - no permission overlap detected',
          affectedRoles: [AdminSubRole.FINANCE_ADMIN, AdminSubRole.OPS_ADMIN],
          recommendation: 'Maintain current segregation - avoid granting users multiple high-privilege roles',
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Conflict 4: Single point of failure (only 1 admin in critical role)
    if (superAdminCount === 1) {
      conflicts.push({
        id: `conflict_single_super_admin`,
        type: 'excess_privilege',
        severity: 'warning',
        description: 'Only 1 SUPER_ADMIN detected - creates single point of failure risk',
        affectedRoles: [AdminSubRole.SUPER_ADMIN],
        recommendation: 'Assign at least 2 SUPER_ADMIN users for redundancy and business continuity',
        detectedAt: new Date().toISOString(),
      });
    }

    // Conflict 5: Missing critical roles
    const criticalRoles = [AdminSubRole.FINANCE_ADMIN, AdminSubRole.OPS_ADMIN];
    criticalRoles.forEach(role => {
      if (!roleGroups[role] || roleGroups[role].length === 0) {
        conflicts.push({
          id: `conflict_missing_${role.toLowerCase()}`,
          type: 'segregation_violation',
          severity: 'warning',
          description: `No ${role} assigned - critical business function may be unmanaged`,
          affectedRoles: [role],
          recommendation: `Assign at least one admin to ${role} role to ensure proper coverage`,
          detectedAt: new Date().toISOString(),
        });
      }
    });

    return conflicts;
  }

  private checkRoleOverlap(role1Permissions: any, role2Permissions: any): boolean {
    // Check if there's any permission overlap between two roles
    const role1Keys = Object.keys(role1Permissions).filter(key => role1Permissions[key] === true);
    const role2Keys = Object.keys(role2Permissions).filter(key => role2Permissions[key] === true);
    
    return role1Keys.some(key => role2Keys.includes(key));
  }

  private buildPermissionMatrix() {
    const modules = [
      { module: 'dashboard', label: 'Dashboard' },
      { module: 'users', label: 'Users' },
      { module: 'agents', label: 'Agents' },
      { module: 'pickups', label: 'Pickups' },
      { module: 'finance', label: 'Finance' },
      { module: 'wallets', label: 'Wallets' },
      { module: 'withdrawals', label: 'Withdrawals' },
      { module: 'performance', label: 'Performance' },
      { module: 'analytics', label: 'Analytics' },
    ];

    return modules.map(mod => {
      const opsPerms = ADMIN_PERMISSIONS[AdminSubRole.OPS_ADMIN];
      const financePerms = ADMIN_PERMISSIONS[AdminSubRole.FINANCE_ADMIN];
      const strategyPerms = ADMIN_PERMISSIONS[AdminSubRole.STRATEGY_ADMIN];
      const superPerms = ADMIN_PERMISSIONS[AdminSubRole.SUPER_ADMIN];

      return {
        module: mod.module,
        moduleLabel: mod.label,
        opsAdmin: this.getPermissionLevel(mod.module, opsPerms),
        financeAdmin: this.getPermissionLevel(mod.module, financePerms),
        strategyAdmin: this.getPermissionLevel(mod.module, strategyPerms),
        superAdmin: this.getPermissionLevel(mod.module, superPerms),
      };
    });
  }

  private getPermissionLevel(module: string, permissions: any): string {
    // Map module to permission key
    const permissionMap: Record<string, string> = {
      dashboard: 'canAccessDashboard',
      users: 'canAccessUsers',
      agents: 'canAccessAgents',
      pickups: 'canAccessPickups',
      finance: 'canAccessFinance',
      wallets: 'canAccessWallets',
      withdrawals: 'canAccessWithdrawals',
      performance: 'canAccessPerformance',
      analytics: 'canAccessAnalytics',
    };

    const permissionKey = permissionMap[module];
    if (!permissionKey) return 'none';

    const hasAccess = permissions[permissionKey];
    
    if (!hasAccess) return 'none';

    // Determine if it's full access or view-only
    // Finance, wallets, withdrawals have full CRUD capabilities
    const fullAccessModules = ['finance', 'wallets', 'withdrawals', 'users', 'agents', 'pickups'];
    
    if (fullAccessModules.includes(module)) {
      return 'full';
    }

    // Dashboard, performance, analytics are typically view-only
    return 'view';
  }
}
