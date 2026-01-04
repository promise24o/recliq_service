import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccountDocument } from './bank-account.model';
import { BankAccount } from '../../domain/entities/bank-account.entity';
import { 
  IBankAccountRepository 
} from '../../domain/repositories/wallet.repository';

@Injectable()
export class BankAccountRepositoryImpl implements IBankAccountRepository {
  constructor(
    @InjectModel('BankAccount')
    private readonly bankAccountModel: Model<BankAccountDocument>,
  ) {}

  async create(bankAccount: BankAccount): Promise<BankAccount> {
    const doc = this.toDocument(bankAccount);
    const savedDoc = await new this.bankAccountModel(doc).save();
    // Return new entity with the generated _id
    return this.toEntity(savedDoc);
  }

  async findById(id: string): Promise<BankAccount | null> {
    const doc = await this.bankAccountModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<BankAccount[]> {
    const docs = await this.bankAccountModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return docs.map(doc => this.toEntity(doc));
  }

  async findByAccountNumber(userId: string, accountNumber: string): Promise<BankAccount | null> {
    const doc = await this.bankAccountModel.findOne({ userId, accountNumber });
    return doc ? this.toEntity(doc) : null;
  }

  async findDefaultByUserId(userId: string): Promise<BankAccount | null> {
    const doc = await this.bankAccountModel.findOne({ userId, isDefault: true });
    return doc ? this.toEntity(doc) : null;
  }

  async update(bankAccount: BankAccount): Promise<void> {
    const doc = this.toDocument(bankAccount);
    await this.bankAccountModel.updateOne(
      { _id: bankAccount.id },
      doc
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.bankAccountModel.deleteOne({ _id: id, userId });
  }

  async unsetDefaultForUser(userId: string): Promise<void> {
    await this.bankAccountModel.updateMany(
      { userId, isDefault: true },
      { isDefault: false }
    );
  }

  async setDefaultForUser(userId: string, bankAccountId: string): Promise<void> {
    await this.bankAccountModel.updateMany(
      { userId, isDefault: true },
      { isDefault: false }
    );

    await this.bankAccountModel.updateOne(
      { _id: bankAccountId, userId },
      { isDefault: true }
    );
  }

  private toEntity(doc: BankAccountDocument): BankAccount {
    return new BankAccount(
      doc._id.toString(),
      doc.userId,
      doc.bankName,
      doc.bankCode,
      doc.accountNumber,
      doc.accountName,
      doc.type as any,
      doc.isDefault,
      doc.recipientCode,
      doc.isActive,
      (doc as any).createdAt || new Date(),
      (doc as any).updatedAt || new Date(),
    );
  }

  private toDocument(bankAccount: BankAccount): any {
    return {
      userId: bankAccount.userId,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      type: bankAccount.type,
      isDefault: bankAccount.isDefault,
      recipientCode: bankAccount.recipientCode,
      isActive: bankAccount.isActive,
      createdAt: bankAccount.createdAt,
      updatedAt: bankAccount.updatedAt,
    };
  }
}
