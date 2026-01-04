import { v4 as uuidv4 } from 'uuid';
import { TransactionType, TransactionStatus } from '../enums/wallet.enum';

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public amount: number,
    public status: TransactionStatus = TransactionStatus.PENDING,
    public readonly description: string,
    public readonly reference?: string,
    public metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public completedAt?: Date,
  ) {}

  markAsSuccessful(): void {
    this.status = TransactionStatus.SUCCESSFUL;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    this.status = TransactionStatus.FAILED;
    this.updatedAt = new Date();
    if (reason) {
      this.metadata = { ...this.metadata, failureReason: reason };
    }
  }

  markAsCancelled(): void {
    this.status = TransactionStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  static create(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    description: string;
    reference?: string;
    metadata?: Record<string, any>;
  }): Transaction {
    return new Transaction(
      uuidv4(),
      data.userId,
      data.type,
      data.amount,
      TransactionStatus.PENDING,
      data.description,
      data.reference,
      data.metadata,
      new Date(),
      new Date(),
      undefined,
    );
  }

  isCompleted(): boolean {
    return this.status === TransactionStatus.SUCCESSFUL;
  }

  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      status: this.status,
      description: this.description,
      reference: this.reference,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
    };
  }
}
