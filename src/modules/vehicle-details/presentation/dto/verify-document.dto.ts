import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../../domain/constants/vehicle.constants';

export class VerifyDocumentDto {
  @ApiProperty({ 
    enum: ['registration', 'insurance', 'roadworthiness', 'inspection_certificate'],
    example: 'registration',
    description: 'Type of document to verify'
  })
  @IsEnum(['registration', 'insurance', 'roadworthiness', 'inspection_certificate'])
  documentType: string;

  @ApiProperty({ 
    enum: [DocumentStatus.VERIFIED, DocumentStatus.REJECTED],
    example: DocumentStatus.VERIFIED,
    description: 'Document verification status'
  })
  @IsEnum([DocumentStatus.VERIFIED, DocumentStatus.REJECTED])
  status: DocumentStatus.VERIFIED | DocumentStatus.REJECTED;

  @ApiProperty({ 
    required: false,
    example: 'Document is clear and valid',
    description: 'Optional verification note (for verified documents)'
  })
  @IsOptional()
  @IsString()
  verificationNote?: string;

  @ApiProperty({ 
    required: false,
    example: 'Document is blurry or expired',
    description: 'Rejection reason (required for rejected documents)'
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class DocumentVerificationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  documentType: string;

  @ApiProperty({ enum: [DocumentStatus.VERIFIED, DocumentStatus.REJECTED] })
  status: string;

  @ApiProperty({ required: false })
  verifiedAt?: string;

  @ApiProperty({ required: false })
  rejectionReason?: string;
}
