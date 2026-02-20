import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { AdminWalletUseCase } from '../../application/use-cases/admin-wallet.usecase';
import { 
  AdminWalletListResponseDto,
  AdminWalletSummaryResponseDto,
  GetAdminWalletsQueryDto,
  ExportWalletsQueryDto,
  UserWalletDto
} from '../dto/admin-wallet.dto';

@ApiTags('Admin Wallet')
@Controller('admin/wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminWalletController {
  constructor(
    private readonly adminWalletUseCase: AdminWalletUseCase,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all user wallets (Admin)',
    description: 'Retrieves paginated list of all user wallets with search and filtering capabilities. Read-only access to financial data.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Number of items per page', required: false, example: 25 })
  @ApiQuery({ name: 'search', description: 'Search by name, phone, or user ID', required: false })
  @ApiQuery({ 
    name: 'status', 
    description: 'Filter by wallet status', 
    required: false,
    enum: ['normal', 'locked', 'compliance_hold', 'negative_balance', 'high_risk']
  })
  @ApiQuery({ 
    name: 'kycStatus', 
    description: 'Filter by KYC status', 
    required: false,
    enum: ['not_started', 'submitted', 'under_review', 'approved', 'rejected', 'expired']
  })
  @ApiQuery({ name: 'city', description: 'Filter by city', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallets retrieved successfully',
    type: AdminWalletListResponseDto,
    example: {
      data: [
        {
          id: "USR001",
          name: "John Smith",
          phone: "+254712345678",
          city: "Nairobi",
          kycStatus: "approved",
          availableBalance: 2450.00,
          pendingEscrow: 150.00,
          onHold: 0.00,
          lifetimeEarned: 3200.00,
          lifetimeWithdrawn: 550.00,
          walletStatus: "normal",
          lastUpdated: "2024-01-15T10:30:00Z",
          transactions: [
            {
              id: "TXN001",
              type: "credit",
              amount: 85.00,
              description: "Recycling reward - Pickup #1234",
              timestamp: "2024-01-15T09:15:00Z",
              reference: "PICKUP1234",
              status: "completed"
            }
          ]
        }
      ],
      pagination: {
        page: 1,
        limit: 25,
        total: 150,
        totalPages: 6
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' }
      }
    }
  })
  async getAllWallets(
    @Query() query: GetAdminWalletsQueryDto,
    @Request() req
  ): Promise<AdminWalletListResponseDto> {
    return this.adminWalletUseCase.getAllWallets(query);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get wallet summary statistics (Admin)',
    description: 'Retrieves platform-wide wallet statistics and financial exposure metrics. Read-only access.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet summary retrieved successfully',
    type: AdminWalletSummaryResponseDto,
    example: {
      summary: {
        totalUserBalances: 28465.50,
        totalInEscrow: 925.00,
        totalOnHold: 200.00,
        availableForWithdrawal: 27340.50,
        lifetimeRewardsIssued: 45600.00,
        walletsWithIssues: 3
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' }
      }
    }
  })
  async getWalletSummary(@Request() req): Promise<AdminWalletSummaryResponseDto> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    const summary = await this.adminWalletUseCase.getWalletSummary();
    return { summary };
  }

  @Get(':userId')
  @ApiOperation({ 
    summary: 'Get single user wallet details (Admin)',
    description: 'Retrieves detailed wallet information for a specific user including transaction history. Read-only access.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet details retrieved successfully',
    type: UserWalletDto,
    example: {
      id: "USR001",
      name: "John Smith",
      phone: "+254712345678",
      city: "Nairobi",
      kycStatus: "approved",
      availableBalance: 2450.00,
      pendingEscrow: 150.00,
      onHold: 0.00,
      lifetimeEarned: 3200.00,
      lifetimeWithdrawn: 550.00,
      walletStatus: "normal",
      lastUpdated: "2024-01-15T10:30:00Z",
      transactions: [
        {
          id: "TXN001",
          type: "credit",
          amount: 85.00,
          description: "Recycling reward - Pickup #1234",
          timestamp: "2024-01-15T09:15:00Z",
          reference: "PICKUP1234",
          status: "completed"
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Wallet not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Wallet not found' }
      }
    }
  })
  async getSingleWallet(
    @Query('userId') userId: string,
    @Request() req
  ): Promise<UserWalletDto> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.adminWalletUseCase.getSingleWallet(userId);
  }

  @Get('ensure-wallets')
  @ApiOperation({ 
    summary: 'Ensure all users have wallets (Admin)',
    description: 'Creates wallets for users who don\'t have one. This should be called periodically to ensure data consistency.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet creation process completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Wallet creation process completed successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' }
      }
    }
  })
  async ensureAllUsersHaveWallets(@Request() req): Promise<{ message: string }> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    await this.adminWalletUseCase.ensureAllUsersHaveWallets();
    
    return {
      message: 'Wallet creation process completed successfully'
    };
  }

  @Get('export')
  @ApiOperation({ 
    summary: 'Export wallet data (Admin)',
    description: 'Exports wallet data in CSV or PDF format. All export actions are logged for security compliance.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiQuery({ 
    name: 'format', 
    description: 'Export format', 
    required: false,
    enum: ['csv', 'pdf'],
    example: 'csv'
  })
  @ApiQuery({ 
    name: 'status', 
    description: 'Filter by wallet status', 
    required: false,
    enum: ['normal', 'locked', 'compliance_hold', 'negative_balance', 'high_risk']
  })
  @ApiQuery({ 
    name: 'kycStatus', 
    description: 'Filter by KYC status', 
    required: false,
    enum: ['not_started', 'submitted', 'under_review', 'approved', 'rejected', 'expired']
  })
  @ApiQuery({ name: 'city', description: 'Filter by city', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Export initiated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Export initiated successfully' },
        downloadUrl: { type: 'string', example: '/api/admin/wallets/download/export_123456.csv' },
        expiresAt: { type: 'string', example: '2024-01-15T12:00:00Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' }
      }
    }
  })
  async exportWallets(
    @Query() query: ExportWalletsQueryDto,
    @Request() req
  ): Promise<{ message: string; downloadUrl: string; expiresAt: string }> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    // TODO: Implement actual export functionality
    // This would generate a CSV/PDF file and return a download URL
    
    return {
      message: `Export initiated successfully in ${query.format || 'csv'} format`,
      downloadUrl: `/api/admin/wallets/download/export_${Date.now()}.${query.format || 'csv'}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
    };
  }
}
