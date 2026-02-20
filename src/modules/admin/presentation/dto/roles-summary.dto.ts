import { ApiProperty } from '@nestjs/swagger';

export class RolesSummaryDto {
  @ApiProperty({ example: 4, description: 'Total number of admin roles defined' })
  totalRoles: number;

  @ApiProperty({ example: 12, description: 'Number of admins with assigned roles' })
  adminsAssigned: number;

  @ApiProperty({ example: 1, description: 'Number of high-privilege roles (SUPER_ADMIN)' })
  highPrivilegeRoles: number;

  @ApiProperty({ example: 8, description: 'Number of actions requiring approval' })
  approvalRequiredActions: number;

  @ApiProperty({ example: 0, description: 'Number of permission conflicts detected' })
  permissionConflicts: number;

  @ApiProperty({ example: '2026-02-15T10:30:00Z', description: 'Timestamp of last role change', required: false })
  lastRoleChange?: string;
}
