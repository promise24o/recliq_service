import { Injectable, Inject } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/wallet.repository';
import { EarningsPeriod } from '../../domain/enums/wallet.enum';

@Injectable()
export class GetEarningsSummaryUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(data: {
    userId: string;
    period: EarningsPeriod;
  }): Promise<{
    total: number;
    count: number;
    bestDay?: { date: string; amount: number };
  }> {
    return await this.transactionRepository.getEarningsSummary(
      data.userId, 
      data.period
    );
  }
}
