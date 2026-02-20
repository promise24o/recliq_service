import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ListAdminsUseCase } from '../../application/use-cases/list-admins.usecase';
import { CreateAdminUseCase } from '../../application/use-cases/create-admin.usecase';
import { UpdateAdminUseCase } from '../../application/use-cases/update-admin.usecase';
import { SuspendAdminUseCase } from '../../application/use-cases/suspend-admin.usecase';
import { ActivateAdminUseCase } from '../../application/use-cases/activate-admin.usecase';
import { RevokeAdminUseCase } from '../../application/use-cases/revoke-admin.usecase';
import { AssignAdminUseCase } from '../../application/use-cases/assign-admin.usecase';
import { GetRolesSummaryUseCase } from '../../application/use-cases/get-roles-summary.usecase';
import { GetRoleDefinitionsUseCase } from '../../application/use-cases/get-role-definitions.usecase';
import { GetPermissionAnalysisUseCase } from '../../application/use-cases/get-permission-analysis.usecase';
import { GetRoleChangeHistoryUseCase } from '../../application/use-cases/get-role-change-history.usecase';
import { GetAdminProfileUseCase } from '../../application/use-cases/get-admin-profile.usecase';
import { GetSecuritySettingsUseCase } from '../../application/use-cases/get-security-settings.usecase';
import { GetAccountActivityUseCase } from '../../application/use-cases/get-account-activity.usecase';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/get-notification-preferences.usecase';
import { UpdateAdminProfileUseCase } from '../../application/use-cases/update-admin-profile.usecase';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.usecase';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/update-notification-preferences.usecase';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AssignAdminDto } from '../dto/assign-admin.dto';
import { UpdateAdminProfileDto } from '../dto/update-admin-profile.dto';
import { AdminChangePasswordDto } from '../dto/change-password.dto';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { RolesSummaryDto } from '../dto/roles-summary.dto';
import { RoleDefinitionDto } from '../dto/role-definition.dto';
import { PermissionAnalysisDto } from '../dto/permission-conflict.dto';
import { RoleChangeEventDto } from '../dto/role-change-history.dto';
import { AdminProfileDto, SecuritySettingsDto, AccountActivityDto, NotificationPreferenceDto } from '../dto/admin-profile.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../../shared/constants/roles';

@ApiTags('admins')
@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly listAdminsUseCase: ListAdminsUseCase,
    private readonly createAdminUseCase: CreateAdminUseCase,
    private readonly updateAdminUseCase: UpdateAdminUseCase,
    private readonly suspendAdminUseCase: SuspendAdminUseCase,
    private readonly activateAdminUseCase: ActivateAdminUseCase,
    private readonly revokeAdminUseCase: RevokeAdminUseCase,
    private readonly assignAdminUseCase: AssignAdminUseCase,
    private readonly getRolesSummaryUseCase: GetRolesSummaryUseCase,
    private readonly getRoleDefinitionsUseCase: GetRoleDefinitionsUseCase,
    private readonly getPermissionAnalysisUseCase: GetPermissionAnalysisUseCase,
    private readonly getRoleChangeHistoryUseCase: GetRoleChangeHistoryUseCase,
    private readonly getAdminProfileUseCase: GetAdminProfileUseCase,
    private readonly getSecuritySettingsUseCase: GetSecuritySettingsUseCase,
    private readonly getAccountActivityUseCase: GetAccountActivityUseCase,
    private readonly getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private readonly updateAdminProfileUseCase: UpdateAdminProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({ status: 200, description: 'List of admin users' })
  async listAdmins() {
    return this.listAdminsUseCase.execute();
  }

  @Get('roles/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get roles overview summary statistics' })
  @ApiResponse({ status: 200, description: 'Roles summary statistics', type: RolesSummaryDto })
  async getRolesSummary(): Promise<RolesSummaryDto> {
    return this.getRolesSummaryUseCase.execute();
  }

  @Get('roles/definitions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all role definitions with assigned admins and permissions' })
  @ApiResponse({ status: 200, description: 'List of role definitions', type: [RoleDefinitionDto] })
  async getRoleDefinitions(): Promise<RoleDefinitionDto[]> {
    return this.getRoleDefinitionsUseCase.execute();
  }

  @Get('permissions/analysis')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get permission conflict analysis and cross-role permission matrix' })
  @ApiResponse({ status: 200, description: 'Permission analysis with conflicts and matrix', type: PermissionAnalysisDto })
  async getPermissionAnalysis(): Promise<PermissionAnalysisDto> {
    return this.getPermissionAnalysisUseCase.execute();
  }

  @Get('roles/change-history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get role change history and audit trail' })
  @ApiResponse({ status: 200, description: 'Timeline of role changes with audit linkage', type: [RoleChangeEventDto] })
  async getRoleChangeHistory(): Promise<RoleChangeEventDto[]> {
    return this.getRoleChangeHistoryUseCase.execute();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 409, description: 'Admin with this email already exists' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.createAdminUseCase.execute(createAdminDto);
  }

  @Patch('change-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change admin password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or validation error' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: AdminChangePasswordDto,
  ) {
    return this.changePasswordUseCase.execute(req.user.id, changePasswordDto, req);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an admin user' })
  @ApiResponse({ status: 200, description: 'Admin user updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.updateAdminUseCase.execute(id, updateAdminDto);
  }

  @Post(':id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend an admin user' })
  @ApiResponse({ status: 200, description: 'Admin user suspended successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async suspendAdmin(@Param('id') id: string) {
    return this.suspendAdminUseCase.execute(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate an admin user' })
  @ApiResponse({ status: 200, description: 'Admin user activated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async activateAdmin(@Param('id') id: string) {
    return this.activateAdminUseCase.execute(id);
  }

  @Post(':id/revoke')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke admin access (removes adminSubRole and suspends account)' })
  @ApiResponse({ status: 200, description: 'Admin access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async revokeAccess(@Param('id') id: string) {
    return this.revokeAdminUseCase.execute(id);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign admin role to a user' })
  @ApiResponse({ status: 200, description: 'Admin role assigned successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  async assignAdmin(@Body() assignAdminDto: AssignAdminDto) {
    return this.assignAdminUseCase.execute(assignAdminDto.adminId, assignAdminDto.roleId);
  }

  @Get('profile/me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current admin profile' })
  @ApiResponse({ status: 200, description: 'Admin profile retrieved', type: AdminProfileDto })
  async getMyProfile(@Request() req) {
    return this.getAdminProfileUseCase.execute(req.user.id);
  }

  @Get('profile/me/security')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security settings for current admin' })
  @ApiResponse({ status: 200, description: 'Security settings retrieved', type: SecuritySettingsDto })
  async getMySecuritySettings(@Request() req) {
    return this.getSecuritySettingsUseCase.execute(req.user.id);
  }

  
  @Get('profile/me/activity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get account activity for current admin' })
  @ApiResponse({ status: 200, description: 'Account activity retrieved', type: [AccountActivityDto] })
  async getMyActivity(@Request() req) {
    return this.getAccountActivityUseCase.execute(req.user.id);
  }

  @Get('profile/me/notifications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get notification preferences for current admin' })
  @ApiResponse({ status: 200, description: 'Notification preferences retrieved', type: [NotificationPreferenceDto] })
  async getMyNotifications(@Request() req) {
    return this.getNotificationPreferencesUseCase.execute(req.user.id);
  }

  @Patch('profile/me')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update current admin profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: AdminProfileDto })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async updateMyProfile(
    @Request() req,
    @Body() updateData: UpdateAdminProfileDto,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    return this.updateAdminProfileUseCase.execute(req.user.id, updateData, photoFile, req);
  }

  @Patch('profile/me/notifications')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update notification preferences for current admin' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async updateMyNotifications(
    @Request() req,
    @Body() preferences: UpdateNotificationPreferencesDto,
  ) {
    console.log('updateMyNotifications endpoint called with:', { userId: req.user.id, preferences });
    try {
      const result = await this.updateNotificationPreferencesUseCase.execute(req.user.id, preferences);
      console.log('updateMyNotifications success:', result);
      return result;
    } catch (error) {
      console.error('updateMyNotifications error:', error);
      throw error;
    }
  }
}
