import { BankAccountType } from '../enums/wallet.enum';

export class BankAccount {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly bankName: string,
    public readonly bankCode: string,
    public readonly accountNumber: string,
    public readonly accountName: string,
    public readonly type: BankAccountType,
    public isDefault: boolean = false,
    public recipientCode?: string,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  unsetAsDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  updateRecipientCode(recipientCode: string): void {
    this.recipientCode = recipientCode;
    this.updatedAt = new Date();
  }

  canBeUsedForWithdrawal(): boolean {
    return this.isActive && this.recipientCode !== undefined;
  }

  static create(data: {
    userId: string;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    type: BankAccountType;
    recipientCode?: string;
  }): BankAccount {
    return new BankAccount(
      '', // ID will be set by repository after saving
      data.userId,
      data.bankName,
      data.bankCode,
      data.accountNumber,
      data.accountName,
      data.type,
      false, // isDefault
      data.recipientCode,
      true, // isActive
      new Date(),
      new Date(),
    );
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      bankName: this.bankName,
      bankCode: this.bankCode,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
      type: this.type,
      isDefault: this.isDefault,
      recipientCode: this.recipientCode,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
