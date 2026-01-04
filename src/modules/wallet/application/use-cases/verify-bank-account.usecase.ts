import { Injectable } from '@nestjs/common';
import { PaystackService } from '../../infrastructure/paystack/paystack.service';

@Injectable()
export class VerifyBankAccountUseCase {
  constructor(
    private readonly paystackService: PaystackService,
  ) {}

  async execute(data: {
    bankCode: string;
    accountNumber: string;
  }): Promise<{
    status: boolean;
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string;
  }> {
    try {
      const response = await this.paystackService.resolveAccountNumber(
        data.accountNumber,
        data.bankCode
      );

      if (!response.status) {
        throw new Error('Account verification failed');
      }

      // Get bank name from bank code
      const banks = await this.paystackService.getBanks();
      const bank = banks.find(b => b.code === data.bankCode);
      
      if (!bank) {
        throw new Error('Invalid bank code');
      }

      return {
        status: true,
        accountName: response.data.account_name,
        accountNumber: response.data.account_number,
        bankName: bank.name,
        bankCode: data.bankCode,
      };
    } catch (error) {
      throw new Error(`Bank account verification failed: ${error.message}`);
    }
  }
}
