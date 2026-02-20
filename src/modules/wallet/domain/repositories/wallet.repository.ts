import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';
import { BankAccount } from '../entities/bank-account.entity';
import { TransactionType, TransactionStatus, EarningsPeriod } from '../enums/wallet.enum';

export interface IWalletRepository {
  create(wallet: Wallet): Promise<void>;
  findById(id: string): Promise<Wallet | null>;
  findByUserId(userId: string): Promise<Wallet | null>;
  update(wallet: Wallet): Promise<void>;
  updateTodayEarnings(userId: string, amount: number): Promise<void>;
  findAll(): Promise<Wallet[]>;
  findAllWithFilter(filter: any, skip?: number, limit?: number): Promise<Wallet[]>;
  countWithFilter(filter: any): Promise<number>;
  getRecentTransactions(userId: string, limit?: number): Promise<any[]>;
  getAllTransactions(): Promise<any[]>;
}

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    type?: TransactionType;
    status?: TransactionStatus;
  }): Promise<Transaction[]>;
  update(transaction: Transaction): Promise<void>;
  getEarningsSummary(userId: string, period: EarningsPeriod): Promise<{
    total: number;
    count: number;
    bestDay?: { date: string; amount: number };
  }>;
  getTotalByType(userId: string, type: TransactionType): Promise<number>;
  getRecentTransactions(userId: string, limit?: number): Promise<Transaction[]>;
}

export interface IBankAccountRepository {
  create(bankAccount: BankAccount): Promise<BankAccount>;
  findById(id: string): Promise<BankAccount | null>;
  findByUserId(userId: string): Promise<BankAccount[]>;
  findByAccountNumber(userId: string, accountNumber: string): Promise<BankAccount | null>;
  findDefaultByUserId(userId: string): Promise<BankAccount | null>;
  update(bankAccount: BankAccount): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  unsetDefaultForUser(userId: string): Promise<void>;
  setDefaultForUser(userId: string, bankAccountId: string): Promise<void>;
}
