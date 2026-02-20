import { ApiProperty } from '@nestjs/swagger';

export class AdminApprovalDto {
  @ApiProperty({
    description: 'Approval decision',
    example: true,
  })
  approved: boolean;

  @ApiProperty({
    description: 'Rejection reason (required if approved is false)',
    example: 'Document quality is poor',
    required: false,
  })
  rejectionReason?: string;
}
