import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiProperty,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { AdminSubRoles } from '../../../auth/infrastructure/decorators/admin-subroles.decorator';
import { UserRole, AdminSubRole } from '../../../auth/domain/constants/user.constants';

// Use Cases
import { GetKycStatusUseCase } from '../../application/use-cases/get-kyc-status.usecase';
import { InitializeKycUseCase } from '../../application/use-cases/initialize-kyc.usecase';
import { UpdateBusinessDetailsUseCase } from '../../application/use-cases/update-business-details.usecase';
import { VerifyBvnUseCase } from '../../application/use-cases/verify-bvn.usecase';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document.usecase';
import { AdminApprovalUseCase } from '../../application/use-cases/admin-approval.usecase';

// DTOs
import { KycStatusResponse } from '../dto/kyc-status.dto';
import { KycInitializeDto } from '../dto/kyc-initialize.dto';
import { BusinessDetailsDto } from '../dto/business-details.dto';
import { BvnVerificationDto } from '../dto/bvn-verification.dto';
import { DocumentUploadDto } from '../dto/document-upload.dto';
import { AdminApprovalDto } from '../dto/admin-approval.dto';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(
    private readonly getKycStatusUseCase: GetKycStatusUseCase,
    private readonly initializeKycUseCase: InitializeKycUseCase,
    private readonly updateBusinessDetailsUseCase: UpdateBusinessDetailsUseCase,
    private readonly verifyBvnUseCase: VerifyBvnUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly adminApprovalUseCase: AdminApprovalUseCase,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get KYC status' })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
    type: KycStatusResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKycStatus(@Query('userId') userId: string): Promise<KycStatusResponse> {
    return this.getKycStatusUseCase.execute(userId);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize KYC - Select user type' })
  @ApiResponse({
    status: 200,
    description: 'KYC initialized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        userType: { type: 'string' },
        currentTier: { type: 'string' },
        status: { type: 'string' },
        requirements: {
          type: 'array',
          items: { type: 'string' }
        },
        limits: {
          type: 'object',
          properties: {
            dailyWithdrawal: { type: 'number' },
            maxWalletBalance: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initializeKyc(@Body() kycDto: KycInitializeDto) {
    return this.initializeKycUseCase.execute(kycDto.userId, kycDto.userType);
  }

  @Post('business-details')
  @ApiOperation({ summary: 'Update business details (Enterprise only)' })
  @ApiResponse({
    status: 200,
    description: 'Business details updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        businessDetails: {
          type: 'object',
          properties: {
            businessName: { type: 'string' },
            businessAddress: { type: 'string' },
            natureOfBusiness: { type: 'string' },
            businessDescription: { type: 'string' },
            businessEmail: { type: 'string' },
            businessPhone: { type: 'string' },
            registrationNumber: { type: 'string' },
            taxIdentificationNumber: { type: 'string' },
          },
        },
        status: { type: 'string' },
        nextStep: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBusinessDetails(@Request() req, @Body() businessDto: BusinessDetailsDto) {
    // Extract userId from authenticated user
    const userId = req.user.id;
    
    return this.updateBusinessDetailsUseCase.execute(userId, businessDto as any);
  }

  @Post('bvn/verify')
  @ApiOperation({ summary: 'Verify BVN with Paystack' })
  @ApiResponse({
    status: 200,
    description: 'BVN verification successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        tier: { type: 'string' },
        limits: {
          type: 'object',
          properties: {
            dailyWithdrawal: { type: 'number' },
            maxWalletBalance: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyBvn(@Body() bvnDto: BvnVerificationDto) {
    return this.verifyBvnUseCase.execute(
      bvnDto.userId,
      bvnDto.bvn,
      bvnDto.accountNumber,
      bvnDto.bankCode,
      bvnDto.userName
    );
  }

  @Get('banks')
  @ApiOperation({ summary: 'Get list of banks for BVN verification' })
  @ApiResponse({
    status: 200,
    description: 'Banks retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          slug: { type: 'string' },
        },
      },
    },
  })
  async getBanks() {
    return this.verifyBvnUseCase.getBanks();
  }

  @Post('account/resolve')
  @ApiOperation({ summary: 'Resolve bank account details' })
  @ApiResponse({
    status: 200,
    description: 'Account resolved successfully',
    schema: {
      type: 'object',
      properties: {
        account_number: { type: 'string' },
        account_name: { type: 'string' },
        bank_id: { type: 'number' },
      },
    },
  })
  async resolveAccount(@Body() body: { accountNumber: string; bankCode: string }) {
    return this.verifyBvnUseCase.resolveAccount(body.accountNumber, body.bankCode);
  }

  @Get('document-types')
  @ApiOperation({ summary: 'Get available document types for KYC' })
  @ApiResponse({
    status: 200,
    description: 'Available document types',
    schema: {
      type: 'object',
      properties: {
        enterprise: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              label: { type: 'string' },
            },
          },
        },
        agent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              label: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getDocumentTypes() {
    return {
      enterprise: [
        { value: 'business_registration', label: 'Business Registration Certificate' },
        { value: 'tax_clearance', label: 'Tax Clearance Certificate' },
        { value: 'memorandum', label: 'Memorandum of Articles of Association' },
        { value: 'utility_bill', label: 'Utility Bill' },
      ],
      agent: [
        { value: 'id_card', label: 'ID Card' },
        { value: 'passport', label: 'Passport' },
      ],
    };
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        documentType: {
          type: 'string',
          enum: [
            'id_card', 'passport', 'utility_bill', 
            'business_registration', 'tax_clearance', 'memorandum'
          ],
          description: 'Document types: id_card, passport (for agents); utility_bill (address verification); business_registration, tax_clearance, memorandum (for enterprises)',
        },
        document: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        documentType: { type: 'string' },
        documentUrl: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadDocument(
    @Body() body: { userId: string; documentType: string },
    @UploadedFile() document: Express.Multer.File,
  ) {
    return this.uploadDocumentUseCase.uploadKycDocument(
      body.userId,
      body.documentType as any,
      document
    );
  }

  @Post('selfie/upload')
  @UseInterceptors(FileInterceptor('selfie'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload KYC selfie' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        selfie: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Selfie uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        documentType: { type: 'string' },
        documentUrl: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadSelfie(
    @Body() body: { userId: string },
    @UploadedFile() selfie: Express.Multer.File,
  ) {
    return this.uploadDocumentUseCase.uploadKycSelfie(body.userId, selfie);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS, AdminSubRole.CUSTOMER_SERVICE)
  @ApiOperation({ summary: 'Get all KYC records (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_progress', 'verified', 'rejected'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'userType',
    required: false,
    enum: ['individual', 'enterprise', 'agent'],
    description: 'Filter by user type',
  })
  @ApiResponse({
    status: 200,
    description: 'All KYC records retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userDetails: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  profilePhoto: { type: 'string' },
                },
              },
              userType: { type: 'string' },
              currentTier: { type: 'string' },
              status: { type: 'string' },
              emailVerified: { type: 'boolean' },
              bvnVerified: { type: 'boolean' },
              documentsUploaded: { type: 'boolean' },
              selfieUploaded: { type: 'boolean' },
              businessDocumentsUploaded: { type: 'boolean' },
              businessDetailsSubmitted: { type: 'boolean' },
              limits: { type: 'object' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllKycRecords(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('userType') userType?: string,
    @Query('search') search?: string,
  ) {
    return this.adminApprovalUseCase.getAllKycRecords(page, limit, status, userType, search);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS, AdminSubRole.CUSTOMER_SERVICE)
  @ApiOperation({ summary: 'Get KYC statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'KYC statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        sprout: { type: 'number' },
        bloom: { type: 'number' },
        thrive: { type: 'number' },
        pending: { type: 'number' },
        individual: { type: 'number' },
        enterprise: { type: 'number' },
        agent: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getKycStats() {
    return this.adminApprovalUseCase.getKycStats();
  }

  @Get('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS, AdminSubRole.CUSTOMER_SERVICE)
  @ApiOperation({ summary: 'Get single KYC record by user ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'KYC record retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        userType: { type: 'string' },
        currentTier: { type: 'string' },
        status: { type: 'string' },
        emailVerified: { type: 'boolean' },
        bvnVerified: { type: 'boolean' },
        documentsUploaded: { type: 'boolean' },
        selfieUploaded: { type: 'boolean' },
        businessDocumentsUploaded: { type: 'boolean' },
        businessDetailsSubmitted: { type: 'boolean' },
        limits: { type: 'object' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              documentType: { type: 'string' },
              documentUrl: { type: 'string' },
              uploadedAt: { type: 'string' },
            },
          },
        },
        businessDocuments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              documentType: { type: 'string' },
              documentUrl: { type: 'string' },
              uploadedAt: { type: 'string' },
            },
          },
        },
        businessDetails: { type: 'object' },
        bvnData: { type: 'object' },
        selfie: { type: 'object' },
        rejectionReason: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'KYC record not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSingleKyc(@Param('userId') userId: string) {
    return this.adminApprovalUseCase.getSingleKyc(userId);
  }

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS, AdminSubRole.CUSTOMER_SERVICE)
  @ApiOperation({ summary: 'Get pending KYC verifications (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Pending verifications retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userType: { type: 'string' },
          currentTier: { type: 'string' },
          status: { type: 'string' },
          requirements: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPendingVerifications() {
    return this.adminApprovalUseCase.getPendingVerifications();
  }

  @Put('admin/:userId/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS)
  @ApiOperation({ summary: 'Approve KYC (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'KYC approved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        newTier: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async approveKyc(@Param('userId') userId: string) {
    return this.adminApprovalUseCase.approveKyc(userId);
  }

  @Put('admin/:userId/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @AdminSubRoles(AdminSubRole.OPERATIONS)
  @ApiOperation({ summary: 'Reject KYC (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rejectionReason: { type: 'string', description: 'Reason for rejection' },
      },
      required: ['rejectionReason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'KYC rejected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async rejectKyc(
    @Param('userId') userId: string,
    @Body() body: { rejectionReason: string }
  ) {
    return this.adminApprovalUseCase.rejectKyc(userId, body.rejectionReason);
  }
}
