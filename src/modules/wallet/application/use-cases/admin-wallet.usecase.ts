import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { WALLET_REPOSITORY_TOKEN } from '../../domain/repositories/wallet.repository.token';
import { USER_REPOSITORY_TOKEN } from '../../../users/domain/repositories/user.repository.token';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { Wallet } from '../../domain/entities/wallet.entity';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';
import {
  UserWalletDto,
  WalletSummaryDto,
  GetAdminWalletsQueryDto,
  WalletStatus,
  KYCStatus,
  TransactionType,
  TransactionStatus,
  WalletTransactionDto
} from '../../presentation/dto/admin-wallet.dto';

@Injectable()
export class AdminWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN) private readonly walletRepository: IWalletRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
  ) { }

  async getAllWallets(query: GetAdminWalletsQueryDto) {
    try {
      const { page = 1, limit = 25, search, status, kycStatus, city } = query;
      const skip = (page - 1) * limit;

      // 1. Fetch all wallets
      const allWallets = await this.walletRepository.findAll();

      // 2. Check if users exist and filter out wallets with no users
      const walletsWithValidUsers = await Promise.all(
        allWallets.map(async (wallet) => {
          const user = await this.userRepository.findById(wallet.userId);

          console.log('User:', user);
          
          // Remove wallet if user doesn't exist
          if (!user) {
            return null;
          }

          // 3. Check user role and remove admin users
          if (user.role === UserRole.ADMIN) {
            return null;
          }

          return { wallet, user };
        })
      );

      // Filter out null entries
      const validWallets = walletsWithValidUsers.filter(item => item !== null);

      // Apply search and other filters
      let filtered = validWallets;
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(({ wallet, user }) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.phone.includes(search) ||
          wallet.id.toLowerCase().includes(searchLower)
        );
      }

      if (city) {
        filtered = filtered.filter(({ user }) =>
          user.city?.toLowerCase().includes(city.toLowerCase())
        );
      }

      if (kycStatus) {
        filtered = filtered.filter(({ user }) =>
          this.mapKycStatusFromUserType(user.type)
            .toLowerCase() === kycStatus.toLowerCase()
        );
      }

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);

      // 4. Add user details to response (excluding sensitive data)
      const data = await Promise.all(
        paginated.map(async ({ wallet, user }) => {
          const transactions = await this.walletRepository.getRecentTransactions(wallet.userId, 10);

          return {
            id: wallet.id,
            userId: wallet.userId,
            name: user.name,
            phone: user.phone,
            city: user.location?.city || 'Unknown',
            kycStatus: this.mapKycStatusFromUserType(user.type),
            // 4. Add all user details except password, pin, etc.
            userDetails: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              status: user.status,
              type: user.type,
              role: user.role,
              location: user.location,
              isVerified: user.isVerified,
              profilePhoto: user.profilePhoto,
              totalRecycles: user.totalRecycles,
              lastActivity: user.lastActivity,
              created: user.created
            },
            availableBalance: wallet.balance,
            pendingEscrow: this.calculatePendingEscrow(transactions),
            onHold: this.calculateOnHold(transactions),
            lifetimeEarned: wallet.totalEarnings,
            lifetimeWithdrawn: this.calculateLifetimeWithdrawn(transactions),
            walletStatus: this.determineWalletStatus(wallet, transactions),
            lastUpdated: wallet.updatedAt.toISOString(),
            transactions: transactions.map(tx => this.mapTransaction(tx)),
          };
        })
      );

      return {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw new BadRequestException('Failed to fetch wallets');
    }
  }

  /**
   * Ensure all users have wallets - call this periodically or when needed
   */
  async ensureAllUsersHaveWallets(): Promise<void> {
    try {
      // Get all users using a basic filter
      const userResult = await this.userRepository.findAll({
        page: 1,
        limit: 1000 // Get first 1000 users
      });

      // Filter out admin users
      const nonAdminUsers = userResult.users.filter(user => !this.isAdminUser(user));

      // For each non-admin user, check if wallet exists
      await Promise.all(nonAdminUsers.map(async (user) => {
        const existingWallet = await this.walletRepository.findByUserId(user.id);
        if (!existingWallet) {
          // Create a new wallet for the user
          const newWallet = Wallet.create(user.id);
          await this.walletRepository.create(newWallet);
          console.log(`Created wallet for user ${user.id}`);
        }
      }));

      console.log('Ensured all non-admin users have wallets');
    } catch (error) {
      console.error('Error ensuring users have wallets:', error);
    }
  }

  async getWalletSummary(): Promise<WalletSummaryDto> {
    // Get all wallets
    const allWallets = await this.walletRepository.findAll();

    // Filter out admin users' wallets
    const nonAdminWallets = await Promise.all(
      allWallets.filter(async (wallet) => {
        try {
          const user = await this.userRepository.findById(wallet.userId);
          return user ? !this.isAdminUser(user) : true; // Include if user not found or not admin
        } catch (error) {
          return true; // Include if error fetching user
        }
      })
    );

    // Get all transactions for calculations (only for non-admin users)
    const allTransactions = await this.walletRepository.getAllTransactions();
    const nonAdminTransactions = allTransactions.filter(tx =>
      nonAdminWallets.some(wallet => wallet.userId === tx.userId)
    );

    // Calculate summary statistics
    const totalUserBalances = nonAdminWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalInEscrow = this.calculateTotalEscrow(nonAdminTransactions);
    const totalOnHold = this.calculateTotalOnHold(nonAdminTransactions);
    const availableForWithdrawal = totalUserBalances - totalOnHold;
    const lifetimeRewardsIssued = nonAdminWallets.reduce((sum, wallet) => sum + wallet.totalEarnings, 0);
    const walletsWithIssues = this.countWalletsWithIssues(nonAdminWallets, nonAdminTransactions);

    return {
      totalUserBalances,
      totalInEscrow,
      totalOnHold,
      availableForWithdrawal,
      lifetimeRewardsIssued,
      walletsWithIssues,
    };
  }

  async getSingleWallet(userId: string): Promise<UserWalletDto> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get user details and check if user is admin
    const user = await this.userRepository.findById(userId);
    if (user && this.isAdminUser(user)) {
      throw new Error('Access denied: Cannot access admin wallet');
    }

    // Get user details
    let userDetails;
    if (user) {
      userDetails = {
        name: user.name,
        phone: user.phone,
        city: user.city || 'Unknown',
        kycStatus: this.mapKycStatusFromUserType(user.type),
      };
    } else {
      // User not found, create basic profile
      userDetails = {
        name: `User ${userId.slice(-8)}`, // Show last 8 chars of ID
        phone: 'Not Available',
        city: 'Unknown',
        kycStatus: KYCStatus.NOT_STARTED,
      };
      console.log(`User not found for wallet: ${userId}`);
    }

    // Get transactions
    const transactions = await this.walletRepository.getRecentTransactions(userId, 50);

    return {
      id: wallet.id,
      userId: wallet.userId,
      name: userDetails.name,
      phone: userDetails.phone,
      city: userDetails.city,
      kycStatus: userDetails.kycStatus,
      availableBalance: wallet.balance,
      pendingEscrow: this.calculatePendingEscrow(transactions),
      onHold: this.calculateOnHold(transactions),
      lifetimeEarned: wallet.totalEarnings,
      lifetimeWithdrawn: this.calculateLifetimeWithdrawn(transactions),
      walletStatus: this.determineWalletStatus(wallet, transactions),
      lastUpdated: wallet.updatedAt.toISOString(),
      transactions: transactions.map(tx => this.mapTransaction(tx)),
    };
  }

  private mapKycStatusFromUserType(userType: string): KYCStatus {
    // For now, map user type to a default KYC status
    // In a real implementation, this would check actual KYC status
    const statusMap: { [key: string]: KYCStatus } = {
      'individual': KYCStatus.APPROVED,
      'enterprise': KYCStatus.APPROVED,
      'agent': KYCStatus.APPROVED,
    };
    return statusMap[userType] || KYCStatus.NOT_STARTED;
  }

  private mapKycStatus(kycStatus: string): KYCStatus {
    const statusMap: { [key: string]: KYCStatus } = {
      'not_started': KYCStatus.NOT_STARTED,
      'submitted': KYCStatus.SUBMITTED,
      'under_review': KYCStatus.UNDER_REVIEW,
      'approved': KYCStatus.APPROVED,
      'rejected': KYCStatus.REJECTED,
      'expired': KYCStatus.EXPIRED,
    };
    return statusMap[kycStatus] || KYCStatus.NOT_STARTED;
  }

  private determineWalletStatus(wallet: any, transactions: any[]): WalletStatus {
    if (wallet.balance < 0) {
      return WalletStatus.NEGATIVE_BALANCE;
    }

    const hasFailedTransactions = transactions.some(tx => tx.status === 'failed' && tx.amount > 1000);
    if (hasFailedTransactions) {
      return WalletStatus.HIGH_RISK;
    }

    const hasLargeEscrow = this.calculatePendingEscrow(transactions) > 10000;
    if (hasLargeEscrow) {
      return WalletStatus.COMPLIANCE_HOLD;
    }

    if (wallet.balance === 0 && wallet.totalEarnings === 0) {
      return WalletStatus.LOCKED;
    }

    return WalletStatus.NORMAL;
  }

  private calculatePendingEscrow(transactions: any[]): number {
    return transactions
      .filter(tx => tx.type === TransactionType.LOCK && tx.status === TransactionStatus.PENDING)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateOnHold(transactions: any[]): number {
    return transactions
      .filter(tx => tx.status === TransactionStatus.PENDING)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateLifetimeWithdrawn(transactions: any[]): number {
    return transactions
      .filter(tx => tx.type === TransactionType.DEBIT && tx.status === TransactionStatus.COMPLETED)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateTotalEscrow(transactions: any[]): number {
    return transactions
      .filter(tx => tx.type === TransactionType.LOCK && tx.status === TransactionStatus.PENDING)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private calculateTotalOnHold(transactions: any[]): number {
    return transactions
      .filter(tx => tx.status === TransactionStatus.PENDING)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  private countWalletsWithIssues(wallets: any[], transactions: any[]): number {
    return wallets.filter(wallet => {
      const walletTransactions = transactions.filter(tx => tx.userId === wallet.userId);
      const status = this.determineWalletStatus(wallet, walletTransactions);
      return status !== WalletStatus.NORMAL;
    }).length;
  }

  private mapTransaction(tx: any): WalletTransactionDto {
    return {
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.createdAt.toISOString(),
      reference: tx.reference,
      status: tx.status,
    };
  }

  /**
   * Check if a user is an admin that should be excluded from wallet listings
   */
  private isAdminUser(user: any): boolean {
    // Check if user has ADMIN role
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has SUPER_ADMIN sub-role
    if (user.adminSubRole === AdminSubRole.SUPER_ADMIN) {
      return true;
    }

    return false;
  }
}
