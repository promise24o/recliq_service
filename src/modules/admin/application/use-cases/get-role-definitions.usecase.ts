import { Injectable, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole, ADMIN_PERMISSIONS } from '../../../../shared/constants/admin-sub-roles';

@Injectable()
export class GetRoleDefinitionsUseCase {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute() {
    // Get all admin users
    const admins = await this.authRepository.findByRole(UserRole.ADMIN);

    // Define role definitions based on AdminSubRole enum
    const roleDefinitions = [
      {
        id: AdminSubRole.OPS_ADMIN,
        role: AdminSubRole.OPS_ADMIN,
        label: 'Operations Administrator',
        purpose: 'Manages daily operations, user support, and agent coordination',
        riskLevel: 'medium',
        status: 'active',
      },
      {
        id: AdminSubRole.FINANCE_ADMIN,
        role: AdminSubRole.FINANCE_ADMIN,
        label: 'Finance Administrator',
        purpose: 'Oversees financial operations, wallets, and withdrawal approvals',
        riskLevel: 'high',
        status: 'active',
      },
      {
        id: AdminSubRole.STRATEGY_ADMIN,
        role: AdminSubRole.STRATEGY_ADMIN,
        label: 'Strategy Administrator',
        purpose: 'Analyzes performance metrics and provides strategic insights',
        riskLevel: 'low',
        status: 'active',
      },
      {
        id: AdminSubRole.SUPER_ADMIN,
        role: AdminSubRole.SUPER_ADMIN,
        label: 'Super Administrator',
        purpose: 'Full system access with override capabilities and role management',
        riskLevel: 'critical',
        status: 'active',
      },
    ];

    // Map roles with assigned admins and permissions
    return roleDefinitions.map(roleDef => {
      // Find admins assigned to this role
      const assignedAdmins = admins
        .filter(admin => admin.adminSubRole === roleDef.role)
        .map(admin => ({
          id: admin.id,
          name: admin.name,
          email: admin.email?.getValue() || '',
          photo: admin.profilePhoto,
        }));

      // Get permissions for this role
      const permissions = ADMIN_PERMISSIONS[roleDef.role as AdminSubRole];

      // Build permission scope
      const permissionScope = {
        modules: this.buildModulePermissions(permissions),
        canOverrideApprovals: roleDef.role === AdminSubRole.SUPER_ADMIN,
        canModifyRoles: roleDef.role === AdminSubRole.SUPER_ADMIN,
      };

      return {
        ...roleDef,
        assignedAdmins,
        permissionScope,
        createdAt: new Date('2026-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private buildModulePermissions(permissions: any) {
    const modules = [
      {
        module: 'dashboard',
        label: 'Dashboard',
        hasAccess: permissions.canAccessDashboard,
      },
      {
        module: 'users',
        label: 'Users',
        hasAccess: permissions.canAccessUsers,
      },
      {
        module: 'agents',
        label: 'Agents',
        hasAccess: permissions.canAccessAgents,
      },
      {
        module: 'pickups',
        label: 'Pickups',
        hasAccess: permissions.canAccessPickups,
      },
      {
        module: 'finance',
        label: 'Finance',
        hasAccess: permissions.canAccessFinance,
      },
      {
        module: 'wallets',
        label: 'Wallets',
        hasAccess: permissions.canAccessWallets,
      },
      {
        module: 'withdrawals',
        label: 'Withdrawals',
        hasAccess: permissions.canAccessWithdrawals,
      },
      {
        module: 'performance',
        label: 'Performance',
        hasAccess: permissions.canAccessPerformance,
      },
      {
        module: 'analytics',
        label: 'Analytics',
        hasAccess: permissions.canAccessAnalytics,
      },
    ];

    return modules.map(mod => ({
      module: mod.module,
      label: mod.label,
      permissions: {
        view: mod.hasAccess,
        create: mod.hasAccess && ['finance', 'wallets', 'withdrawals', 'users', 'agents'].includes(mod.module),
        edit: mod.hasAccess && ['finance', 'wallets', 'users', 'agents', 'pickups'].includes(mod.module),
        delete: mod.hasAccess && ['users', 'agents'].includes(mod.module),
        approve: mod.hasAccess && ['withdrawals', 'finance'].includes(mod.module),
      },
    }));
  }
}
