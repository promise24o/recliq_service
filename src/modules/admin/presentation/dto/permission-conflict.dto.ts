import { ApiProperty } from '@nestjs/swagger';

export class PermissionConflictDto {
  @ApiProperty({ example: 'conflict_001' })
  id: string;

  @ApiProperty({ 
    example: 'segregation_violation', 
    enum: ['segregation_violation', 'excess_privilege', 'conflicting_scope'] 
  })
  type: string;

  @ApiProperty({ example: 'critical', enum: ['critical', 'warning', 'info'] })
  severity: string;

  @ApiProperty({ example: 'Multiple SUPER_ADMIN roles detected - violates least privilege principle' })
  description: string;

  @ApiProperty({ example: ['SUPER_ADMIN'], type: [String] })
  affectedRoles: string[];

  @ApiProperty({ example: 'Limit SUPER_ADMIN assignments to maximum 2 users and audit regularly' })
  recommendation: string;

  @ApiProperty({ example: '2026-02-15T10:30:00Z' })
  detectedAt: string;
}

export class PermissionMatrixEntryDto {
  @ApiProperty({ example: 'dashboard' })
  module: string;

  @ApiProperty({ example: 'Dashboard' })
  moduleLabel: string;

  @ApiProperty({ example: 'full', enum: ['full', 'view', 'none'] })
  opsAdmin: string;

  @ApiProperty({ example: 'none', enum: ['full', 'view', 'none'] })
  financeAdmin: string;

  @ApiProperty({ example: 'none', enum: ['full', 'view', 'none'] })
  strategyAdmin: string;

  @ApiProperty({ example: 'full', enum: ['full', 'view', 'none'] })
  superAdmin: string;
}

export class PermissionAnalysisDto {
  @ApiProperty({ type: [PermissionConflictDto] })
  conflicts: PermissionConflictDto[];

  @ApiProperty({ type: [PermissionMatrixEntryDto] })
  permissionMatrix: PermissionMatrixEntryDto[];
}
