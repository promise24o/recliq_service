import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { WalletController } from './presentation/controllers/wallet.controller';
import { GetWalletUseCase } from './application/use-cases/get-wallet.usecase';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.usecase';
import { GetEarningsSummaryUseCase } from './application/use-cases/get-earnings-summary.usecase';
import { VerifyBankAccountUseCase } from './application/use-cases/verify-bank-account.usecase';
import { LinkBankAccountUseCase } from './application/use-cases/link-bank-account.usecase';
import { GetBankAccountsUseCase } from './application/use-cases/get-bank-accounts.usecase';
import { SetDefaultBankAccountUseCase } from './application/use-cases/set-default-bank-account.usecase';
import { RemoveBankAccountUseCase } from './application/use-cases/remove-bank-account.usecase';
import { WithdrawUseCase } from './application/use-cases/withdraw.usecase';
import { GetWalletOverviewUseCase } from './application/use-cases/get-wallet-overview.usecase';
import { WalletRepositoryImpl } from './infrastructure/persistence/wallet.repository.impl';
import { TransactionRepositoryImpl } from './infrastructure/persistence/transaction.repository.impl';
import { BankAccountRepositoryImpl } from './infrastructure/persistence/bank-account.repository.impl';
import { PaystackService } from './infrastructure/paystack/paystack.service';
import { BankAccountNotificationService } from './infrastructure/email/bank-account-notification.service';
import { WalletSchema } from './infrastructure/persistence/wallet.model';
import { TransactionSchema } from './infrastructure/persistence/transaction.model';
import { BankAccountSchema } from './infrastructure/persistence/bank-account.model';
import { WalletSeedingService } from './infrastructure/services/wallet-seeding.service';
import { Env } from '../../core/config/env';
import { SharedEmailModule } from '../../shared/email/shared-email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Wallet', schema: WalletSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'BankAccount', schema: BankAccountSchema }
    ]),
    SharedEmailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [WalletController],
  providers: [
    GetWalletUseCase,
    GetTransactionsUseCase,
    GetEarningsSummaryUseCase,
    VerifyBankAccountUseCase,
    LinkBankAccountUseCase,
    GetBankAccountsUseCase,
    SetDefaultBankAccountUseCase,
    RemoveBankAccountUseCase,
    WithdrawUseCase,
    GetWalletOverviewUseCase,
    BankAccountNotificationService,
    WalletSeedingService,
    {
      provide: 'IWalletRepository',
      useClass: WalletRepositoryImpl,
    },
    {
      provide: 'ITransactionRepository',
      useClass: TransactionRepositoryImpl,
    },
    {
      provide: 'IBankAccountRepository',
      useClass: BankAccountRepositoryImpl,
    },
    PaystackService,
    {
      provide: Env,
      useFactory: (configService: ConfigService) => new Env(configService),
      inject: [ConfigService],
    },
  ],
  exports: [
    'IWalletRepository',
    'ITransactionRepository',
    'IBankAccountRepository',
    GetWalletUseCase,
    GetTransactionsUseCase,
    GetEarningsSummaryUseCase,
    VerifyBankAccountUseCase,
    LinkBankAccountUseCase,
    GetBankAccountsUseCase,
    SetDefaultBankAccountUseCase,
    RemoveBankAccountUseCase,
    WithdrawUseCase,
    GetWalletOverviewUseCase,
    WalletSeedingService,
    PaystackService,
  ],
})
export class WalletModule {}
