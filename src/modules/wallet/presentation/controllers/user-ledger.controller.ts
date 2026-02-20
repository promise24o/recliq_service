import { Controller, Get, Query, UseGuards, Request, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { UserLedgerUseCase } from '../../application/use-cases/user-ledger.usecase';
import { 
  UserLedgerDto,
  GetUserLedgerQueryDto,
  TransactionCategory
} from '../dto/user-ledger.dto';

@ApiTags('Finance - User Ledger')
@Controller('finance/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserLedgerController {
  constructor(
    private readonly userLedgerUseCase: UserLedgerUseCase,
  ) {}

  @Get(':userId/ledger')
  @ApiOperation({ 
    summary: 'Get comprehensive user financial ledger',
    description: 'Retrieves complete financial history for a user including all transactions, rewards, withdrawals, escrow activities, and financial metrics. This provides a complete picture of how the user arrived at their current financial status.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiQuery({ 
    name: 'includeFullHistory', 
    description: 'Include complete transaction history (default: false, returns limited recent transactions)', 
    required: false,
    type: Boolean
  })
  @ApiQuery({ 
    name: 'transactionLimit', 
    description: 'Number of recent transactions to return when not including full history', 
    required: false,
    example: 50
  })
  @ApiQuery({ 
    name: 'category', 
    description: 'Filter transactions by category', 
    required: false,
    enum: TransactionCategory,
    example: 'reward'
  })
  @ApiQuery({ 
    name: 'dateFrom', 
    description: 'Filter transactions from date (YYYY-MM-DD)', 
    required: false,
    example: '2024-01-01'
  })
  @ApiQuery({ 
    name: 'dateTo', 
    description: 'Filter transactions to date (YYYY-MM-DD)', 
    required: false,
    example: '2024-12-31'
  })
  @ApiQuery({ 
    name: 'sortBy', 
    description: 'Sort transactions by field', 
    required: false,
    enum: ['date', 'amount', 'type'],
    example: 'date'
  })
  @ApiQuery({ 
    name: 'sortOrder', 
    description: 'Sort order', 
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User ledger retrieved successfully',
    type: UserLedgerDto,
    example: {
      userId: "USR001",
      userName: "John Smith",
      userPhone: "+254712345678",
      userEmail: "john.smith@example.com",
      userCity: "Nairobi",
      kycStatus: "approved",
      userDetails: {
        id: "USR001",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+254712345678",
        status: "active",
        type: "individual",
        role: "USER",
        location: {
          type: "Point",
          coordinates: [-1.2921, 36.8219],
          city: "Nairobi",
          state: "Nairobi County",
          country: "Kenya"
        },
        isVerified: true,
        profilePhoto: "https://example.com/profile.jpg",
        totalRecycles: 45,
        lastActivity: "2026-01-04T15:33:48.400Z",
        created: "2023-06-15T10:30:00Z"
      },
      accountNumber: "ACC12345678",
      accountName: "John Smith",
      financialMetrics: {
        totalEarnings: 15420.50,
        currentBalance: 8750.00,
        escrowAmount: 250.00,
        onHoldAmount: 0.00,
        availableForWithdrawal: 8500.00,
        totalWithdrawn: 6670.50,
        netProfit: 8750.00,
        accountCreatedDate: "2023-06-15T10:30:00Z",
        firstTransactionDate: "2023-06-15T11:00:00Z",
        daysActive: 248,
        averageDailyEarnings: 62.18
      },
      rewardBreakdown: {
        recyclingRewards: 14200.00,
        referralBonuses: 1200.00,
        otherRewards: 20.50,
        recyclingTransactions: 45,
        referralCount: 3,
        averageRewardPerTransaction: 342.22
      },
      withdrawalSummary: {
        totalWithdrawn: 6670.50,
        withdrawalCount: 8,
        averageWithdrawalAmount: 833.81,
        lastWithdrawalDate: "2024-02-10T14:30:00Z",
        lastWithdrawalAmount: 1500.00
      },
      transactions: [
        {
          id: "TXN_USR001_PICKUP_45",
          type: "credit",
          amount: 450.00,
          category: "reward",
          source: "recycling_pickup",
          description: "Recycling reward - Pickup #1045",
          reference: "PICKUP_1045",
          status: "completed",
          runningBalance: 8750.00,
          relatedEntityId: "PICKUP_1045",
          timestamp: "2024-02-19T09:15:00Z",
          processedAt: "2024-02-19T11:15:00Z",
          notes: "Materials collected: Plastic"
        }
      ],
      totalTransactions: 67,
      generatedAt: "2024-02-19T15:30:00Z"
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
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' }
      }
    }
  })
  async getUserLedger(
    @Param('userId') userId: string,
    @Query() query: GetUserLedgerQueryDto,
    @Request() req
  ): Promise<UserLedgerDto> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.userLedgerUseCase.getUserLedger(userId, query);
  }

  @Get(':userId/ledger/summary')
  @ApiOperation({ 
    summary: 'Get user financial summary',
    description: 'Retrieves a quick financial overview of a user without the detailed transaction history. Perfect for dashboard widgets and quick views.',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'USR001' },
        userName: { type: 'string', example: 'John Smith' },
        currentBalance: { type: 'number', example: 8750.00 },
        totalEarnings: { type: 'number', example: 15420.50 },
        totalWithdrawn: { type: 'number', example: 6670.50 },
        availableForWithdrawal: { type: 'number', example: 8500.00 },
        lastTransactionDate: { type: 'string', example: '2024-02-19T09:15:00Z' },
        transactionCount: { type: 'number', example: 67 }
      }
    }
  })
  async getUserFinancialSummary(
    @Param('userId') userId: string,
    @Query() query: GetUserLedgerQueryDto,
    @Request() req
  ): Promise<any> {
    // TODO: Add admin role check
    // if (!req.user.roles?.includes('admin')) {
    //   throw new ForbiddenException('Admin access required');
    // }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Get full ledger but return only summary data
    const ledger = await this.userLedgerUseCase.getUserLedger(userId, { ...query, transactionLimit: 1 });

    return {
      userId: ledger.userId,
      userName: ledger.userName,
      currentBalance: ledger.financialMetrics.currentBalance,
      totalEarnings: ledger.financialMetrics.totalEarnings,
      totalWithdrawn: ledger.financialMetrics.totalWithdrawn,
      availableForWithdrawal: ledger.financialMetrics.availableForWithdrawal,
      lastTransactionDate: ledger.transactions[0]?.timestamp,
      transactionCount: ledger.totalTransactions,
      kycStatus: ledger.kycStatus,
      accountStatus: ledger.financialMetrics.currentBalance > 0 ? 'active' : 'inactive'
    };
  }
}
