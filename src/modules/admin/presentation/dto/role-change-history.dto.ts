import { ApiProperty } from '@nestjs/swagger';

export class RoleChangeEventDto {
  @ApiProperty({ example: 'event_001' })
  id: string;

  @ApiProperty({ 
    example: 'role_assigned', 
    enum: ['role_assigned', 'role_revoked', 'role_disabled', 'role_enabled', 'permission_updated', 'admin_suspended', 'admin_activated'] 
  })
  action: string;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  targetRole: string;

  @ApiProperty({ example: 'John Doe' })
  targetAdmin?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  targetAdminId?: string;

  @ApiProperty({ example: 'Admin Smith' })
  actor: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  actorId: string;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  actorRole: string;

  @ApiProperty({ example: 'Assigned SUPER_ADMIN role to John Doe for system administration' })
  description: string;

  @ApiProperty({ example: 'Required for emergency system maintenance and configuration', required: false })
  reason?: string;

  @ApiProperty({ example: 'audit_log_12345', required: false })
  linkedAuditLogId?: string;

  @ApiProperty({ example: '2026-02-15T12:15:00Z' })
  timestamp: string;
}
