import { v4 as uuidv4 } from 'uuid';

export class Wallet {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public balance: number,
    public totalEarnings: number,
    public todayEarnings: number,
    public accountNumber: string | null = null,
    public accountName: string | null = null,
    public lastWithdrawnAmount: number = 0,
    public lastTransactionDate: Date | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  credit(amount: number, description?: string): void {
    this.balance += amount;
    this.totalEarnings += amount;
    
    // Check if this is today's earning
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    
    if (now >= today) {
      this.todayEarnings += amount;
    }
    
    this.updatedAt = new Date();
  }

  debit(amount: number, description?: string): void {
    if (!this.hasSufficientBalance(amount)) {
      throw new Error('Insufficient balance');
    }
    
    this.balance -= amount;
    this.updatedAt = new Date();
  }

  hasSufficientBalance(amount: number): boolean {
    return this.balance >= amount;
  }

  resetTodayEarnings(): void {
    this.todayEarnings = 0;
    this.updatedAt = new Date();
  }

  updateAccountDetails(accountNumber: string, accountName: string): void {
    this.accountNumber = accountNumber;
    this.accountName = accountName;
    this.updatedAt = new Date();
  }

  recordWithdrawal(amount: number): void {
    this.lastWithdrawnAmount = amount;
    this.lastTransactionDate = new Date();
    this.updatedAt = new Date();
  }

  static create(userId: string): Wallet {
    return new Wallet(
      uuidv4(),
      userId,
      0, // balance
      0, // totalEarnings
      0, // todayEarnings
      null, // accountNumber
      null, // accountName
      0, // lastWithdrawnAmount
      null, // lastTransactionDate
      new Date(),
      new Date(),
    );
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      balance: this.balance,
      totalEarnings: this.totalEarnings,
      todayEarnings: this.todayEarnings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
