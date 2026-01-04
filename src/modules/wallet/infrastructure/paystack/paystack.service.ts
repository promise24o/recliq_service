import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface Bank {
  name: string;
  code: string;
}

export interface ResolveAccountResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

export interface CreateTransferRecipientResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    bank_name: string;
    recipient_code: string;
  };
}

export interface InitiateTransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    transfer_code: string;
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.paystack.co';
    // Always use live keys as requested
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY_LIVE') || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getBanks(): Promise<Bank[]> {
    try {
      const response: AxiosResponse<{ status: boolean; data: Bank[] }> = await axios.get(
        `${this.baseUrl}/bank`,
        { headers: this.getHeaders() }
      );

      if (response.data.status) {
        return response.data.data;
      }

      throw new Error('Failed to fetch banks from Paystack');
    } catch (error) {
      this.logger.error('Error fetching banks:', error);
      throw error;
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<ResolveAccountResponse> {
    try {
      const response: AxiosResponse<ResolveAccountResponse> = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Account resolution failed');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error resolving account number:', error);
      throw error;
    }
  }

  async createTransferRecipient(data: {
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
  }): Promise<CreateTransferRecipientResponse> {
    try {
      const response: AxiosResponse<CreateTransferRecipientResponse> = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: data.type,
          name: data.name,
          account_number: data.account_number,
          bank_code: data.bank_code,
          currency: data.currency || 'NGN',
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to create transfer recipient');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error creating transfer recipient:', error);
      throw error;
    }
  }

  async initiateTransfer(data: {
    source: string;
    amount: number;
    recipient: string;
    reason?: string;
  }): Promise<InitiateTransferResponse> {
    try {
      const response: AxiosResponse<InitiateTransferResponse> = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: data.source,
          amount: data.amount,
          recipient: data.recipient,
          reason: data.reason,
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to initiate transfer');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error initiating transfer:', error);
      throw error;
    }
  }

  async verifyTransfer(reference: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfer/verify/${reference}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error verifying transfer:', error);
      throw error;
    }
  }

  getPublicKey(): string {
    // Always use live public key as requested
    return this.configService.get<string>('PAYSTACK_PUBLIC_KEY_LIVE') || '';
  }
}
