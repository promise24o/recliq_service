export enum TransactionType {
  EARNING = 'earning',
  WITHDRAWAL = 'withdrawal',
  AIRTIME_PURCHASE = 'airtime_purchase',
  DATA_PURCHASE = 'data_purchase',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  PENALTY = 'penalty',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export enum BankAccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
}

export enum EarningsPeriod {
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  THIS_MONTH = 'this_month',
  ALL_TIME = 'all_time',
}
