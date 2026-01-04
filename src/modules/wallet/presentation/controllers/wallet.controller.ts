import { Controller, Get, Post, Body, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';

// Use Cases
import { GetWalletUseCase } from '../../application/use-cases/get-wallet.usecase';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.usecase';
import { GetEarningsSummaryUseCase } from '../../application/use-cases/get-earnings-summary.usecase';
import { GetWalletOverviewUseCase } from '../../application/use-cases/get-wallet-overview.usecase';
import { VerifyBankAccountUseCase } from '../../application/use-cases/verify-bank-account.usecase';
import { LinkBankAccountUseCase } from '../../application/use-cases/link-bank-account.usecase';
import { GetBankAccountsUseCase } from '../../application/use-cases/get-bank-accounts.usecase';
import { SetDefaultBankAccountUseCase } from '../../application/use-cases/set-default-bank-account.usecase';
import { RemoveBankAccountUseCase } from '../../application/use-cases/remove-bank-account.usecase';
import { WithdrawUseCase } from '../../application/use-cases/withdraw.usecase';

// Services
import { PaystackService } from '../../infrastructure/paystack/paystack.service';

// DTOs
import {
  WalletResponseDto,
  TransactionResponseDto,
  BankAccountResponseDto,
  GetTransactionsDto,
  GetEarningsSummaryDto,
  VerifyBankAccountDto,
  LinkBankAccountDto,
  SetDefaultBankAccountDto,
  WithdrawDto,
  TransactionListResponseDto,
  EarningsSummaryResponseDto,
  BankAccountListResponseDto,
  WithdrawalResponseDto,
  BankVerificationResponseDto,
  BanksListResponseDto,
} from '../dto/wallet.dto';
import { ModernWalletCardDto } from '../dto/modern-wallet-card.dto';
import { RemoveBankAccountDto } from '../dto/remove-bank-account.dto';
import { EarningsPeriod } from '../../domain/enums/wallet.enum';

@ApiExtraModels(
  WalletResponseDto,
  TransactionResponseDto,
  BankAccountResponseDto,
  TransactionListResponseDto,
  EarningsSummaryResponseDto,
  BanksListResponseDto,
  BankVerificationResponseDto,
  BankAccountListResponseDto,
  WithdrawalResponseDto
)
@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(
    private readonly getWalletUseCase: GetWalletUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly getEarningsSummaryUseCase: GetEarningsSummaryUseCase,
    private readonly getWalletOverviewUseCase: GetWalletOverviewUseCase,
    private readonly verifyBankAccountUseCase: VerifyBankAccountUseCase,
    private readonly linkBankAccountUseCase: LinkBankAccountUseCase,
    private readonly getBankAccountsUseCase: GetBankAccountsUseCase,
    private readonly setDefaultBankAccountUseCase: SetDefaultBankAccountUseCase,
    private readonly removeBankAccountUseCase: RemoveBankAccountUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly paystackService: PaystackService,
  ) {}

  // Wallet Home
  @Get()
  @ApiOperation({ 
    summary: 'Get wallet balance and summary',
    description: 'Retrieves the current wallet balance, total earnings, and today\'s earnings for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet data retrieved successfully',
    type: WalletResponseDto,
    example: {
      id: "6956cd1d842c6afdc694d3fe",
      balance: 1500.50,
      totalEarnings: 5000.00,
      todayEarnings: 150.00,
      createdAt: "2026-01-01T19:38:05.542Z",
      updatedAt: "2026-01-02T10:57:10.765Z"
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
  async getWallet(@Request() req): Promise<WalletResponseDto> {
    const wallet = await this.getWalletUseCase.execute(req.user.id);
    return {
      id: wallet.id,
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      todayEarnings: wallet.todayEarnings,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }

  // Wallet Overview (Modern Card View)
  @Get('overview')
  @ApiOperation({ 
    summary: 'Get modern wallet card overview',
    description: 'Returns comprehensive wallet information in a modern card format including balance, earnings, account details, and transaction history',
    security: [{ 'JWT-auth': [] }]
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wallet overview retrieved successfully',
    type: ModernWalletCardDto,
    examples: {
      example: {
        summary: 'Sample wallet overview',
        value: {
          availableBalance: 300000,
          todayEarnings: 10000,
          lastWithdrawnAmount: 20000,
          accountNumber: '3447838348',
          accountName: 'JOHN DOE',
          totalEarnings: 500000,
          lastTransactionDate: '2025-01-04T06:30:00.000Z'
        }
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
  async getWalletOverview(@Request() req): Promise<ModernWalletCardDto> {
    return this.getWalletOverviewUseCase.execute(req.user.id);
  }

  // Transactions
  @Get('transactions')
  @ApiOperation({ 
    summary: 'Get transaction history',
    description: 'Retrieves paginated transaction history with optional filtering by type and status'
  })
  @ApiQuery({ 
    name: 'type', 
    description: 'Filter by transaction type', 
    required: false,
    enum: ['EARNING', 'WITHDRAWAL', 'BONUS', 'REFUND']
  })
  @ApiQuery({ 
    name: 'status', 
    description: 'Filter by status', 
    required: false,
    enum: ['PENDING', 'SUCCESSFUL', 'FAILED']
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of transactions to return', 
    required: false,
    type: 'integer',
    minimum: 1,
    maximum: 100,
    example: 20
  })
  @ApiQuery({ 
    name: 'offset', 
    description: 'Number of transactions to skip', 
    required: false,
    type: 'integer',
    minimum: 0,
    example: 0
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transactions retrieved successfully',
    type: TransactionListResponseDto,
    example: {
      transactions: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          type: "EARNING",
          amount: 150.00,
          status: "SUCCESSFUL",
          description: "PET bottle collection - 50 bottles",
          reference: "TXN_123456789",
          createdAt: "2026-01-01T19:38:05.542Z",
          completedAt: "2026-01-01T19:38:05.542Z"
        }
      ],
      hasMore: true,
      total: 50
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
  async getTransactions(
    @Query() query: GetTransactionsDto,
    @Request() req
  ): Promise<TransactionListResponseDto> {
    const result = await this.getTransactionsUseCase.execute({
      userId: req.user.id,
      type: query.type,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      transactions: result.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString(),
      })),
      hasMore: result.hasMore,
      total: result.total,
    };
  }

  // Earnings Summary
  @Get('earnings')
  @ApiOperation({ 
    summary: 'Get earnings summary',
    description: 'Retrieves earnings summary for a specific period (today, week, month, year, or all time)'
  })
  @ApiQuery({ 
    name: 'period', 
    description: 'Earnings period', 
    required: false,
    enum: ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL_TIME'],
    example: 'ALL_TIME'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Earnings summary retrieved successfully',
    type: EarningsSummaryResponseDto,
    examples: {
      all_time: {
        summary: 'All time earnings',
        value: {
          total: 5000.00,
          count: 125,
          bestDay: {
            date: "2026-01-01",
            amount: 500.00
          }
        }
      },
      today: {
        summary: 'Today\'s earnings',
        value: {
          total: 150.00,
          count: 5
        }
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
  async getEarningsSummary(
    @Query() query: GetEarningsSummaryDto,
    @Request() req
  ): Promise<EarningsSummaryResponseDto> {
    const result = await this.getEarningsSummaryUseCase.execute({
      userId: req.user.id,
      period: query.period || EarningsPeriod.ALL_TIME,
    });

    return result;
  }

  // Banks
  @Get('banks')
  @ApiOperation({ 
    summary: 'Get list of supported banks',
    description: 'Retrieves list of all supported banks with their codes for bank account operations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Banks retrieved successfully',
    type: BanksListResponseDto,
    example: {
      banks: [
        { name: "Guaranty Trust Bank", code: "058" },
        { name: "Access Bank", code: "044" },
        { name: "First Bank of Nigeria", code: "011" },
        { name: "United Bank for Africa", code: "033" }
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
  async getBanks(): Promise<BanksListResponseDto> {
    const banks = await this.paystackService.getBanks();
    return { banks };
  }

  // Bank Account Verification
  @Post('bank/verify')
  @ApiOperation({ 
    summary: 'Verify bank account details',
    description: 'Verifies bank account details before linking to ensure validity'
  })
  @ApiBody({ 
    type: VerifyBankAccountDto,
    examples: {
      valid_account: {
        summary: 'Valid bank account',
        value: {
          bankCode: "058",
          accountNumber: "0123456789"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bank account verified successfully',
    type: BankVerificationResponseDto,
    example: {
      status: true,
      accountName: "John Doe",
      accountNumber: "0123456789",
      bankName: "Guaranty Trust Bank",
      bankCode: "058"
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid bank account details',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid account number' },
        error: { type: 'string', example: 'Account verification failed' }
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
  async verifyBankAccount(
    @Body() dto: VerifyBankAccountDto
  ): Promise<BankVerificationResponseDto> {
    const result = await this.verifyBankAccountUseCase.execute(dto);
    return result;
  }

  // Link Bank Account
  @Post('bank/link')
  @ApiOperation({ 
    summary: 'Link a new bank account',
    description: 'Links a new bank account to the user\'s wallet after verification'
  })
  @ApiBody({ 
    type: LinkBankAccountDto,
    examples: {
      bank_account: {
        summary: 'Link bank account',
        value: {
          bankCode: "058",
          accountNumber: "0123456789"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bank account linked successfully',
    type: BankAccountResponseDto,
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      bankName: "Guaranty Trust Bank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "John Doe",
      type: "SAVINGS",
      isDefault: false,
      isActive: true,
      createdAt: "2026-01-01T19:38:05.542Z"
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid bank details or verification failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Bad Request' },
        error: { type: 'string', example: 'Bank account verification failed' }
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
    status: 409, 
    description: 'Bank account already linked',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Bank account already linked' }
      }
    }
  })
  async linkBankAccount(
    @Body() dto: LinkBankAccountDto,
    @Request() req
  ): Promise<BankAccountResponseDto> {
    // First verify the account
    const verification = await this.verifyBankAccountUseCase.execute({
      bankCode: dto.bankCode,
      accountNumber: dto.accountNumber,
    });

    // Then link it
    const bankAccount = await this.linkBankAccountUseCase.execute({
      userId: req.user.id,
      bankCode: dto.bankCode,
      accountNumber: dto.accountNumber,
      accountName: verification.accountName,
      bankName: verification.bankName,
    });

    return {
      id: bankAccount.id,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      type: bankAccount.type,
      isDefault: bankAccount.isDefault,
      isActive: bankAccount.isActive,
      createdAt: bankAccount.createdAt.toISOString(),
    };
  }

  // Get Bank Accounts
  @Get('bank/accounts')
  @ApiOperation({ 
    summary: 'Get linked bank accounts',
    description: 'Retrieves all bank accounts linked to the user\'s wallet'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bank accounts retrieved successfully',
    type: BankAccountListResponseDto,
    example: {
      bankAccounts: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          bankName: "Guaranty Trust Bank",
          bankCode: "058",
          accountNumber: "0123456789",
          accountName: "John Doe",
          type: "SAVINGS",
          isDefault: true,
          isActive: true,
          createdAt: "2026-01-01T19:38:05.542Z"
        }
      ],
      total: 1
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
  async getBankAccounts(@Request() req): Promise<BankAccountListResponseDto> {
    const bankAccounts = await this.getBankAccountsUseCase.execute(req.user.id);
    
    return {
      bankAccounts: bankAccounts.map(ba => ({
        id: ba.id,
        bankName: ba.bankName,
        bankCode: ba.bankCode,
        accountNumber: ba.accountNumber,
        accountName: ba.accountName,
        type: ba.type,
        isDefault: ba.isDefault,
        isActive: ba.isActive,
        createdAt: ba.createdAt.toISOString(),
      })),
      total: bankAccounts.length,
    };
  }

  // Set Default Bank Account
  @Post('bank/set-default')
  @ApiOperation({ 
    summary: 'Set default bank account',
    description: 'Sets a bank account as the default for withdrawals'
  })
  @ApiBody({ 
    type: SetDefaultBankAccountDto,
    examples: {
      default_account: {
        summary: 'Set default bank account',
        value: {
          bankAccountId: "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Default bank account updated successfully',
    type: BankAccountResponseDto,
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      bankName: "Guaranty Trust Bank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "John Doe",
      type: "SAVINGS",
      isDefault: true,
      isActive: true,
      createdAt: "2026-01-01T19:38:05.542Z"
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid bank account ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Bad Request' },
        error: { type: 'string', example: 'Invalid bank account ID' }
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
    status: 404, 
    description: 'Bank account not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Bank account not found' }
      }
    }
  })
  async setDefaultBankAccount(
    @Body() dto: SetDefaultBankAccountDto,
    @Request() req
  ): Promise<BankAccountResponseDto> {
    const bankAccount = await this.setDefaultBankAccountUseCase.execute({
      userId: req.user.id,
      bankAccountId: dto.bankAccountId,
    });

    return {
      id: bankAccount.id,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      type: bankAccount.type,
      isDefault: bankAccount.isDefault,
      isActive: bankAccount.isActive,
      createdAt: bankAccount.createdAt.toISOString(),
    };
  }

  // Remove Bank Account
  @Post('bank/remove')
  @ApiOperation({ 
    summary: 'Remove linked bank account',
    description: 'Removes a bank account from the user\'s wallet. Cannot remove if it\'s the only account.'
  })
  @ApiBody({ 
    type: RemoveBankAccountDto,
    examples: {
      remove_account: {
        summary: 'Remove bank account',
        value: {
          bankAccountId: "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bank account removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Bank account removed successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot remove default or only account',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Cannot remove default bank account' },
        error: { type: 'string', example: 'You must set another account as default first' }
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
    status: 404, 
    description: 'Bank account not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Bank account not found' }
      }
    }
  })
  async removeBankAccount(
    @Body() dto: RemoveBankAccountDto,
    @Request() req
  ): Promise<{ message: string }> {
    try {
      await this.removeBankAccountUseCase.execute({
        userId: req.user.id,
        bankAccountId: dto.bankAccountId,
      });

      return { message: 'Bank account removed successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Withdraw
  @Post('withdraw')
  @ApiOperation({ 
    summary: 'Initiate withdrawal',
    description: 'Initiates a withdrawal to a bank account. Uses default bank account if not specified.'
  })
  @ApiBody({ 
    type: WithdrawDto,
    examples: {
      to_default_account: {
        summary: 'Withdraw to default bank account',
        value: {
          amount: 1500.00,
          reason: "Weekly withdrawal"
        }
      },
      to_specific_account: {
        summary: 'Withdraw to specific bank account',
        value: {
          amount: 2000.00,
          bankAccountId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Monthly withdrawal"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Withdrawal initiated successfully',
    type: WithdrawalResponseDto,
    example: {
      message: "Withdrawal initiated successfully",
      reference: "TXN_123456789",
      status: "pending",
      estimatedCompletionTime: "2026-01-02T12:00:00.000Z"
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Insufficient balance or invalid amount',
    content: {
      'application/json': {
        examples: {
          insufficient_balance: {
            summary: 'Insufficient balance',
            value: {
              statusCode: 400,
              message: "Insufficient balance",
              error: "Available balance: 1500.00, Requested: 2000.00"
            }
          },
          invalid_amount: {
            summary: 'Invalid withdrawal amount',
            value: {
              statusCode: 400,
              message: "Minimum withdrawal amount is 100.00",
              error: "Amount must be at least 100.00"
            }
          }
        }
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
    status: 404, 
    description: 'Bank account not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Bank account not found' }
      }
    }
  })
  async withdraw(
    @Body() dto: WithdrawDto,
    @Request() req
  ): Promise<WithdrawalResponseDto> {
    const result = await this.withdrawUseCase.execute({
      userId: req.user.id,
      amount: dto.amount,
      bankAccountId: dto.bankAccountId,
      reason: dto.reason,
    });

    return result;
  }

  // Paystack Public Key (for frontend)
  @Get('paystack/public-key')
  @ApiOperation({ 
    summary: 'Get Paystack public key',
    description: 'Retrieves Paystack public key for frontend payment integration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Paystack public key retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        publicKey: { 
          type: 'string',
          description: 'Paystack public key for frontend integration',
          example: "pk_test_1234567890abcdef"
        }
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
  async getPaystackPublicKey(): Promise<{ publicKey: string }> {
    const publicKey = this.paystackService.getPublicKey();
    return { publicKey };
  }
}
