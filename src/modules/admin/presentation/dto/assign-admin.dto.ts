import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignAdminDto {
  @ApiProperty({ 
    example: '6991964f5eb2f4796c4f1510',
    description: 'The ID of the admin user to assign the role to'
  })
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @ApiProperty({ 
    example: 'FINANCE_ADMIN',
    description: 'The admin sub-role to assign',
    enum: ['OPS_ADMIN', 'FINANCE_ADMIN', 'STRATEGY_ADMIN', 'SUPER_ADMIN']
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
