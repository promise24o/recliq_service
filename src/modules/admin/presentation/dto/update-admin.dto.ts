import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

export class UpdateAdminDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'admin@recliq.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: AdminSubRole, example: AdminSubRole.OPS_ADMIN, required: false })
  @IsEnum(AdminSubRole)
  @IsOptional()
  adminSubRole?: AdminSubRole;
}
