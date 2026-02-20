import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface PaystackBvnResponse {
  status: boolean;
  message: string;
  data?: {
    first_name: boolean;
    last_name: boolean;
    bvn: string;
    account_number: string;
    bank_code: string;
  };
}

export interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY_LIVE') || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Verify BVN against bank account details
   */
  async verifyBvn(bvn: string, accountNumber: string, bankCode: string, firstName: string, lastName: string): Promise<PaystackBvnResponse> {
    try {
      this.logger.log(`Verifying BVN: ${bvn} for account: ${accountNumber} at bank: ${bankCode}`);
      
      const response: AxiosResponse<PaystackBvnResponse> = await axios.post(
        `${this.baseUrl}/bvn/match`,
        {
          bvn,
          account_number: accountNumber,
          bank_code: bankCode,
          first_name: firstName,
          last_name: lastName,
        },
        {
          headers: this.getHeaders(),
        }
      );

      this.logger.log(`BVN verification response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error verifying BVN:', error.response?.data || error.message);
      throw new Error(`BVN verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get list of banks
   */
  async getBanks(): Promise<PaystackBank[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers: this.getHeaders(),
        params: {
          country: 'nigeria',
          perPage: 100,
        },
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching banks:', error.response?.data || error.message);
      throw new Error(`Failed to fetch banks: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Resolve bank account details
   */
  async resolveAccount(accountNumber: string, bankCode: string): Promise<{
    account_number: string;
    account_name: string;
    bank_id: number;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/bank/resolve`, {
        headers: this.getHeaders(),
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });

      return response.data.data;
    } catch (error) {
      this.logger.error('Error resolving account:', error.response?.data || error.message);
      throw new Error(`Account resolution failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate BVN format
   */
  validateBvnFormat(bvn: string): boolean {
    // BVN should be 11 digits
    return /^\d{11}$/.test(bvn);
  }

  /**
   * Validate account number format
   */
  validateAccountNumberFormat(accountNumber: string): boolean {
    // Account numbers are typically 10 digits but can vary
    return /^\d{10}$/.test(accountNumber);
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';
  }
}
