import { ApiProperty } from '@nestjs/swagger';

export class AssignedAdminDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@recliq.com' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  photo?: string;
}

export class ModulePermissionDto {
  @ApiProperty({ example: 'dashboard' })
  module: string;

  @ApiProperty({ example: 'Dashboard' })
  label: string;

  @ApiProperty()
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
  };
}

export class PermissionScopeDto {
  @ApiProperty({ type: [ModulePermissionDto] })
  modules: ModulePermissionDto[];

  @ApiProperty({ example: false })
  canOverrideApprovals: boolean;

  @ApiProperty({ example: false })
  canModifyRoles: boolean;
}

export class RoleDefinitionDto {
  @ApiProperty({ example: 'OPS_ADMIN' })
  id: string;

  @ApiProperty({ example: 'OPS_ADMIN' })
  role: string;

  @ApiProperty({ example: 'Operations Administrator' })
  label: string;

  @ApiProperty({ example: 'Manages daily operations, user support, and agent coordination' })
  purpose: string;

  @ApiProperty({ type: [AssignedAdminDto] })
  assignedAdmins: AssignedAdminDto[];

  @ApiProperty({ type: PermissionScopeDto })
  permissionScope: PermissionScopeDto;

  @ApiProperty({ example: 'medium', enum: ['low', 'medium', 'high', 'critical'] })
  riskLevel: string;

  @ApiProperty({ example: 'active', enum: ['active', 'disabled'] })
  status: string;

  @ApiProperty({ example: '2026-02-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-02-15T10:30:00Z' })
  updatedAt: string;
}
