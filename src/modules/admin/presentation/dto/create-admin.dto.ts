import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

export class CreateAdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@recliq.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: AdminSubRole, example: AdminSubRole.OPS_ADMIN })
  @IsEnum(AdminSubRole)
  @IsNotEmpty()
  adminSubRole: AdminSubRole;
}
