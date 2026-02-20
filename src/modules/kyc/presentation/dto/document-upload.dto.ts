import { ApiProperty } from '@nestjs/swagger';

export class DocumentUploadDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  userId: string;

  @ApiProperty({
    description: 'Document type',
    enum: ['id_card', 'passport', 'utility_bill', 'business_registration', 'tax_clearance', 'memorandum'],
    example: 'id_card',
  })
  documentType: string;
}

export class SelfieUploadDto {
  @ApiProperty({
    description: 'User ID',
    example: '6956cd1d842c6afdc694d3fe',
  })
  userId: string;
}
