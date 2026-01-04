import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionDocument } from './transaction.model';
import { Transaction } from '../../domain/entities/transaction.entity';
import { 
  ITransactionRepository 
} from '../../domain/repositories/wallet.repository';
import { TransactionType, TransactionStatus, EarningsPeriod } from '../../domain/enums/wallet.enum';

@Injectable()
export class TransactionRepositoryImpl implements ITransactionRepository {
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async create(transaction: Transaction): Promise<void> {
    const doc = this.toDocument(transaction);
    await new this.transactionModel(doc).save();
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await this.transactionModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    type?: TransactionType;
    status?: TransactionStatus;
  }): Promise<Transaction[]> {
    const query: any = { userId };
    
    if (options?.type) {
      query.type = options.type;
    }
    
    if (options?.status) {
      query.status = options.status;
    }

    const docs = await this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.offset || 0)
      .exec();

    return docs.map(doc => this.toEntity(doc));
  }

  async update(transaction: Transaction): Promise<void> {
    const doc = this.toDocument(transaction);
    await this.transactionModel.updateOne(
      { _id: transaction.id },
      doc
    );
  }

  async getEarningsSummary(userId: string, period: EarningsPeriod): Promise<{
    total: number;
    count: number;
    bestDay?: { date: string; amount: number };
  }> {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case EarningsPeriod.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case EarningsPeriod.THIS_WEEK:
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case EarningsPeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case EarningsPeriod.ALL_TIME:
        startDate = new Date(0);
        break;
    }

    const earningsTransactions = await this.transactionModel.find({
      userId,
      type: TransactionType.EARNING,
      status: TransactionStatus.SUCCESSFUL,
      createdAt: { $gte: startDate }
    });

    const total = earningsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const count = earningsTransactions.length;

    // Find best day
    const dailyEarnings: Record<string, number> = {};
    earningsTransactions.forEach(t => {
      const date = (t.createdAt instanceof Date) ? t.createdAt.toISOString().split('T')[0] : new Date(t.createdAt).toISOString().split('T')[0];
      dailyEarnings[date] = (dailyEarnings[date] || 0) + t.amount;
    });

    let bestDay: { date: string; amount: number } | undefined;
    if (Object.keys(dailyEarnings).length > 0) {
      const maxDay = Object.entries(dailyEarnings).reduce((max, [date, amount]) => 
        amount > max.amount ? { date, amount } : max, 
        { date: '', amount: 0 }
      );
      bestDay = maxDay;
    }

    return { total, count, bestDay };
  }

  async getTotalByType(userId: string, type: TransactionType): Promise<number> {
    const result = await this.transactionModel.aggregate([
      { $match: { userId, type, status: TransactionStatus.SUCCESSFUL } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  }

  async getRecentTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    const docs = await this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map(doc => this.toEntity(doc));
  }

  private toEntity(doc: TransactionDocument): Transaction {
    return new Transaction(
      doc._id.toString(),
      doc.userId,
      doc.type as TransactionType,
      doc.amount,
      doc.status as TransactionStatus,
      doc.description,
      doc.reference,
      doc.metadata,
      (doc as any).createdAt || new Date(),
      (doc as any).updatedAt || new Date(),
      doc.completedAt,
    );
  }

  private toDocument(transaction: Transaction): any {
    return {
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      reference: transaction.reference,
      metadata: transaction.metadata,
      completedAt: transaction.completedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
