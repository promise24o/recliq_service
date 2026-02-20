import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletDocument } from './wallet.model';
import { Wallet } from '../../domain/entities/wallet.entity';
import { IWalletRepository } from '../../domain/repositories/wallet.repository';

@Injectable()
export class WalletRepositoryImpl implements IWalletRepository {
  constructor(
    @InjectModel('Wallet')
    private readonly walletModel: Model<WalletDocument>,
  ) {}

  async create(wallet: Wallet): Promise<void> {
    const doc = this.toDocument(wallet);
    await new this.walletModel(doc).save();
  }

  async findById(id: string): Promise<Wallet | null> {
    const doc = await this.walletModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    const doc = await this.walletModel.findOne({ userId });
    return doc ? this.toEntity(doc) : null;
  }

  async update(wallet: Wallet): Promise<void> {
    const doc = this.toDocument(wallet);
    await this.walletModel.updateOne(
      { userId: wallet.userId },
      doc,
      { upsert: true }
    );
  }

  async updateTodayEarnings(userId: string, amount: number): Promise<void> {
    await this.walletModel.updateOne(
      { userId },
      { 
        $inc: { 
          todayEarnings: amount,
          totalEarnings: amount,
          balance: amount
        },
        updatedAt: new Date()
      },
      { upsert: true }
    );
  }

  async findAll(): Promise<Wallet[]> {
    const docs = await this.walletModel.find().exec();
    return docs.map(doc => this.toEntity(doc));
  }

  async findAllWithFilter(filter: any, skip: number = 0, limit?: number): Promise<Wallet[]> {
    const query = this.walletModel.find(filter);
    
    if (skip > 0) {
      query.skip(skip);
    }
    
    if (limit) {
      query.limit(limit);
    }
    
    const docs = await query.exec();
    return docs.map(doc => this.toEntity(doc));
  }

  async countWithFilter(filter: any): Promise<number> {
    return this.walletModel.countDocuments(filter).exec();
  }

  async getRecentTransactions(userId: string, limit: number = 10): Promise<any[]> {
    // This method should be handled by the transaction repository directly
    // Returning empty array for now - the use case will handle transaction fetching
    return [];
  }

  async getAllTransactions(): Promise<any[]> {
    // This method should be handled by the transaction repository directly
    // Returning empty array for now - the use case will handle transaction fetching
    return [];
  }

  private toEntity(doc: WalletDocument): Wallet {
    return new Wallet(
      doc._id.toString(),
      doc.userId,
      doc.balance,
      doc.totalEarnings,
      doc.todayEarnings,
      doc.accountNumber,
      doc.accountName,
      doc.lastWithdrawnAmount,
      doc.lastTransactionDate,
      (doc as any).createdAt || new Date(),
      (doc as any).updatedAt || new Date(),
    );
  }

  private toDocument(wallet: Wallet): any {
    return {
      userId: wallet.userId,
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      todayEarnings: wallet.todayEarnings,
      accountNumber: wallet.accountNumber,
      accountName: wallet.accountName,
      lastWithdrawnAmount: wallet.lastWithdrawnAmount,
      lastTransactionDate: wallet.lastTransactionDate,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
