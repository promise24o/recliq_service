import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignAgentDto {
  @ApiProperty({ example: 'AGT001', description: 'Agent ID to assign' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ example: 'Samuel Kamau', description: 'Agent name' })
  @IsString()
  @IsNotEmpty()
  agentName: string;
}
