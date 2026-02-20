import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  User, 
  UserFilter, 
  UserPaginationResult, 
  UserSummary, 
  UserDetail, 
  UserActionRequest,
  UserStatus,
  UserType,
  UserActivityStats,
  UserWalletSnapshot,
  UserRiskSignals
} from '../../domain/types/user.types';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { UserDocument, UserStatus as DbUserStatus } from '../../../auth/infrastructure/persistence/user.model';
import { KycDocument } from '../../../kyc/infrastructure/persistence/kyc.model';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Kyc') private kycModel: Model<KycDocument>
  ) {}

  // Helper method to convert UserDocument to User domain type
  private convertToUser(userDoc: UserDocument, kycDoc?: KycDocument): User {
    // Use the actual status from database or calculate based on activity
    let status: UserStatus;
    
    // If status is explicitly set in database, use it
    if (userDoc.status === DbUserStatus.SUSPENDED) {
      status = UserStatus.SUSPENDED;
    } else if (userDoc.status === DbUserStatus.FLAGGED_FOR_REVIEW) {
      status = UserStatus.SUSPENDED; // Treat flagged as suspended for now
    } else if (userDoc.status === DbUserStatus.INACTIVE) {
      status = UserStatus.DORMANT;
    } else {
      // For ACTIVE status, determine based on activity
      status = this.determineUserStatus(userDoc);
    }
    
    // Determine user type based on KYC data if available, otherwise fallback to role
    let type: UserType;
    if (kycDoc) {
      // Map KYC user type to domain user type
      switch (kycDoc.userType) {
        case 'individual':
          type = UserType.INDIVIDUAL;
          break;
        case 'enterprise':
          type = UserType.ENTERPRISE;
          break;
        case 'agent':
          type = UserType.AGENT;
          break;
        default:
          type = UserType.INDIVIDUAL;
      }
    } else {
      // Fallback to role-based determination if no KYC data
      type = userDoc.role === 'ADMIN' ? UserType.ENTERPRISE : UserType.INDIVIDUAL;
    }

    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      phone: userDoc.phone || '',
      email: userDoc.email || '',
      city: userDoc.city || '', // Default - would need to be added to user schema
      zone: userDoc.zone || '', // Default - would need to be added to user schema
      status,
      type,
      role: userDoc.role,
      totalRecycles: 0, // Would need to be calculated from pickup requests
      lastActivity: userDoc.updatedAt || userDoc.createdAt,
      created: userDoc.createdAt,
      walletBalance: 0, // Would need to come from wallet service
      pendingEscrow: 0, // Would need to come from wallet service
      disputesRaised: 0, // Would need to be calculated from disputes
      cancellations: 0, // Would need to be calculated from pickups
      avgResponseTime: 15, // Would need to be calculated from pickup data
      profilePhoto: userDoc.profilePhoto,
      isVerified: userDoc.isVerified,
      location: userDoc.location, // Add location field
    };
  }

  private determineUserStatus(userDoc: UserDocument): UserStatus {
    if (!userDoc.isVerified) return UserStatus.DORMANT;
    if (userDoc.role === 'ADMIN') return UserStatus.ACTIVE;
    
    // For regular users, determine based on activity
    const daysSinceLastActivity = Math.floor(
      (Date.now() - userDoc.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity > 90) return UserStatus.CHURNED;
    if (daysSinceLastActivity > 30) return UserStatus.DORMANT;
    return UserStatus.ACTIVE;
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await this.userModel.findById(id).exec();
    return userDoc ? this.convertToUser(userDoc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ email }).exec();
    return userDoc ? this.convertToUser(userDoc) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ phone }).exec();
    return userDoc ? this.convertToUser(userDoc) : null;
  }

  async findAll(filter: UserFilter): Promise<UserPaginationResult> {
    let query: any = { role: 'USER' }; // Only include users, not admins

    // Build query based on filters
    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
      query.role = 'USER'; // Keep the role filter
    }

    if (filter.status) {
      // Convert domain status to database status
      let dbStatus: DbUserStatus;
      switch (filter.status) {
        case UserStatus.SUSPENDED:
          dbStatus = DbUserStatus.SUSPENDED;
          break;
        case UserStatus.DORMANT:
          dbStatus = DbUserStatus.INACTIVE;
          break;
        default:
          dbStatus = DbUserStatus.ACTIVE;
      }
      query.status = dbStatus;
    }

    // Apply date filters
    if (filter.dateFrom || filter.dateTo) {
      query.createdAt = {};
      if (filter.dateFrom) {
        query.createdAt.$gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        query.createdAt.$lte = new Date(filter.dateTo);
      }
    }

    const page = filter.page || 1;
    const limit = filter.limit || 25;
    const skip = (page - 1) * limit;

    let userDocs;
    let totalUsers;

    if (filter.type) {
      // If filtering by type, we need to join with KYC data
      const kycUserType = filter.type === UserType.ENTERPRISE ? 'enterprise' : 
                        filter.type === UserType.AGENT ? 'agent' : 'individual';
      
      // Find users with KYC data matching the requested type
      const kycDocs = await this.kycModel.find({ userType: kycUserType }).exec();
      const userIds = kycDocs.map(kyc => kyc.userId);
      
      // Apply KYC type filter to user query
      query._id = { $in: userIds };
    }

    totalUsers = await this.userModel.countDocuments(query);
    userDocs = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Fetch KYC data for all users to determine their types
    const userIds = userDocs.map(user => user._id.toString());
    const kycDocs = await this.kycModel.find({ userId: { $in: userIds } }).exec();
    const kycMap = new Map(kycDocs.map(kyc => [kyc.userId, kyc]));

    const users = userDocs.map(user => {
      const kycDoc = kycMap.get(user._id.toString());
      return this.convertToUser(user, kycDoc);
    });

    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    };
  }

  private paginateResults(users: User[], page: number, limit: number): UserPaginationResult {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      pagination: {
        total: users.length,
        page,
        limit,
        pages: Math.ceil(users.length / limit),
      },
    };
  }

  async findActiveUsers(): Promise<User[]> {
    const userDocs = await this.userModel.find({ role: 'USER', isVerified: true }).exec();
    
    // Fetch KYC data for all users to determine their types
    const userIds = userDocs.map(user => user._id.toString());
    const kycDocs = await this.kycModel.find({ userId: { $in: userIds } }).exec();
    const kycMap = new Map(kycDocs.map(kyc => [kyc.userId, kyc]));

    const users = userDocs.map(user => {
      const kycDoc = kycMap.get(user._id.toString());
      return this.convertToUser(user, kycDoc);
    }).filter(user => user.status === UserStatus.ACTIVE);
    
    return users;
  }

  async findDormantUsers(): Promise<User[]> {
    const userDocs = await this.userModel.find({ role: 'USER' }).exec();
    return userDocs.map(user => this.convertToUser(user)).filter(user => user.status === UserStatus.DORMANT);
  }

  async findSuspendedUsers(): Promise<User[]> {
    // For now, return empty array as suspended status isn't stored in user schema
    // Would need to add suspension fields to user schema
    return [];
  }

  async getUserSummary(): Promise<UserSummary> {
    const totalUsers = await this.userModel.countDocuments({ role: 'USER' });
    const verifiedUsers = await this.userModel.countDocuments({ role: 'USER', isVerified: true });
    
    // Calculate status breakdown based on user activity
    const allUsers = await this.userModel.find({ role: 'USER' }).exec();
    const convertedUsers = allUsers.map(user => this.convertToUser(user));
    
    const activeUsers = convertedUsers.filter(user => user.status === UserStatus.ACTIVE).length;
    const dormantUsers = convertedUsers.filter(user => user.status === UserStatus.DORMANT).length;
    const churnedUsers = convertedUsers.filter(user => user.status === UserStatus.CHURNED).length;
    const suspendedUsers = convertedUsers.filter(user => user.status === UserStatus.SUSPENDED).length;

    return {
      totalUsers,
      activeUsers,
      dormantUsers,
      churnedUsers,
      suspendedUsers,
    };
  }

  async getUserStats(userId: string): Promise<UserDetail> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const activityStats: UserActivityStats = {
      totalPickups: user.totalRecycles,
      completedPickups: user.totalRecycles - user.cancellations,
      cancelledPickups: user.cancellations,
      avgResponseTime: user.avgResponseTime,
      lastActivityDate: user.lastActivity,
    };

    const walletSnapshot: UserWalletSnapshot = {
      balance: user.walletBalance,
      pendingEscrow: user.pendingEscrow,
      lifetimeRewards: user.walletBalance * 0.1,
      totalEarnings: user.walletBalance + user.pendingEscrow,
    };

    const trustScore = user.disputesRaised === 0 ? 'high' : user.disputesRaised <= 2 ? 'medium' : 'low';
    const riskSignals: UserRiskSignals = {
      disputesRaised: user.disputesRaised,
      cancellations: user.cancellations,
      trustScore,
      riskFlags: user.disputesRaised > 2 ? ['High dispute rate'] : [],
    };

    return {
      ...user,
      activityStats,
      walletSnapshot,
      riskSignals,
    };
  }

  async suspendUser(userId: string, reason?: string, notes?: string): Promise<User> {
    const userDoc = await this.userModel.findByIdAndUpdate(
      userId, 
      { 
        status: DbUserStatus.SUSPENDED,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!userDoc) {
      throw new Error('User not found');
    }

    return this.convertToUser(userDoc);
  }

  async reactivateUser(userId: string, reason?: string, notes?: string): Promise<User> {
    const userDoc = await this.userModel.findByIdAndUpdate(
      userId, 
      { 
        status: DbUserStatus.ACTIVE,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!userDoc) {
      throw new Error('User not found');
    }

    return this.convertToUser(userDoc);
  }

  async flagUser(userId: string, reason?: string, notes?: string): Promise<User> {
    const userDoc = await this.userModel.findByIdAndUpdate(
      userId, 
      { 
        status: DbUserStatus.FLAGGED_FOR_REVIEW,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!userDoc) {
      throw new Error('User not found');
    }

    return this.convertToUser(userDoc);
  }

  async searchUsers(query: string, filter?: Partial<UserFilter>): Promise<UserPaginationResult> {
    const searchFilter: UserFilter = {
      search: query,
      ...filter,
      page: filter?.page || 1,
      limit: filter?.limit || 25,
    };

    return this.findAll(searchFilter);
  }

  async exportUsers(filter: UserFilter): Promise<User[]> {
    const result = await this.findAll({ ...filter, page: 1, limit: 10000 });
    return result.users;
  }

  async updateLastActivity(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { updatedAt: new Date() });
  }

  async incrementUserStats(userId: string, stats: Partial<Pick<User, 'totalRecycles' | 'cancellations' | 'disputesRaised'>>): Promise<void> {
    // Would need to add these fields to user schema
    // For now, just update the updatedAt timestamp
    await this.updateLastActivity(userId);
  }

  async updateUserStatus(userId: string, status: User['status']): Promise<User> {
    // Would need to add status field to user schema
    const userDoc = await this.userModel.findById(userId);
    if (!userDoc) {
      throw new Error('User not found');
    }

    return this.convertToUser(userDoc);
  }

  async updateUserType(userId: string, type: User['type']): Promise<User> {
    const userDoc = await this.userModel.findById(userId);
    if (!userDoc) {
      throw new Error('User not found');
    }

    // Update role based on type
    const newRole = type === UserType.ENTERPRISE ? 'ADMIN' : 'USER';
    await this.userModel.findByIdAndUpdate(userId, { role: newRole });

    return this.convertToUser(userDoc);
  }

  async getUserWalletSnapshot(userId: string): Promise<Pick<User, 'walletBalance' | 'pendingEscrow'>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      walletBalance: user.walletBalance,
      pendingEscrow: user.pendingEscrow,
    };
  }

  async getUsersByCity(city: string): Promise<User[]> {
    // Would need to add city field to user schema
    // For now, return all users (not admins)
    const userDocs = await this.userModel.find({ role: 'USER' }).exec();
    return userDocs.map(user => this.convertToUser(user));
  }

  async getUsersByZone(zone: string): Promise<User[]> {
    // Would need to add zone field to user schema
    // For now, return all users (not admins)
    const userDocs = await this.userModel.find({ role: 'USER' }).exec();
    return userDocs.map(user => this.convertToUser(user));
  }

  async getCitiesWithUsers(): Promise<string[]> {
    // Would need to add city field to user schema
    return ['Lagos', 'Port Harcourt', 'Abuja', 'Kano', 'Ibadan'];
  }

  async getZonesWithUsers(): Promise<string[]> {
    // Would need to add zone field to user schema
    return ['Ikoyi', 'Victoria Island', 'GRA', 'Sabon Gari', 'Maitama'];
  }

  async getUsersCreatedBetween(startDate: Date, endDate: Date): Promise<User[]> {
    const userDocs = await this.userModel.find({
      role: 'USER',
      createdAt: { $gte: startDate, $lte: endDate }
    }).exec();
    return userDocs.map(user => this.convertToUser(user));
  }

  async getUsersWithActivityBetween(startDate: Date, endDate: Date): Promise<User[]> {
    const userDocs = await this.userModel.find({
      role: 'USER',
      updatedAt: { $gte: startDate, $lte: endDate }
    }).exec();
    return userDocs.map(user => this.convertToUser(user));
  }

  async bulkUpdateStatus(userIds: string[], status: User['status']): Promise<void> {
    // Would need to add status field to user schema
    // For now, just update updatedAt timestamps
    await this.userModel.updateMany(
      { _id: { $in: userIds } },
      { updatedAt: new Date() }
    );
  }

  async bulkSuspendUsers(userIds: string[], reason?: string): Promise<void> {
    // Would need to add suspension fields to user schema
    // For now, just update updatedAt timestamps
    await this.bulkUpdateStatus(userIds, UserStatus.SUSPENDED);
  }
}
