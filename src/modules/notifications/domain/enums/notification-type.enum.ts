export enum NotificationType {
  // Transaction & Wallet Notifications 💰
  WALLET_CREDIT = 'wallet_credit',
  WALLET_DEBIT = 'wallet_debit',
  WITHDRAWAL_SUCCESS = 'withdrawal_success',
  WITHDRAWAL_PENDING = 'withdrawal_pending',
  WITHDRAWAL_FAILED = 'withdrawal_failed',

  // Pickup & Recycling Activity ♻️
  PICKUP_REQUESTED = 'pickup_requested',
  AGENT_ASSIGNED = 'agent_assigned',
  AGENT_ARRIVING = 'agent_arriving',
  MATERIAL_WEIGHED = 'material_weighed',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PICKUP_CANCELLED = 'pickup_cancelled',
  PICKUP_RESCHEDULED = 'pickup_rescheduled',

  // Agent Interaction & Trust 🛡️
  AGENT_VERIFIED = 'agent_verified',
  RATE_AGENT = 'rate_agent',
  REPORT_RESOLVED = 'report_resolved',
  PICKUP_ISSUE = 'pickup_issue',

  // Account & Security Notifications 🔒
  LOGIN_DETECTED = 'login_detected',
  NEW_DEVICE_LOGIN = 'new_device_login',
  PASSWORD_CHANGED = 'password_changed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',

  // Rewards & Gamification 🏆
  MILESTONE_REACHED = 'milestone_reached',
  RECYCLING_STREAK = 'recycling_streak',
  BONUS_EARNED = 'bonus_earned',
  LEADERBOARD_UPDATE = 'leaderboard_update',

  // Impact & Sustainability Updates 🌍
  CO2_SAVED = 'co2_saved',
  MONTHLY_RECYCLING = 'monthly_recycling',
  COMMUNITY_IMPACT = 'community_impact',

  // System & App Updates ⚙️
  MAINTENANCE_NOTICE = 'maintenance_notice',
  NEW_FEATURE = 'new_feature',
  POLICY_UPDATE = 'policy_update',

  // Promotions & Announcements 📣
  LIMITED_TIME_BONUS = 'limited_time_bonus',
  PARTNER_OFFER = 'partner_offer',
  REFERRAL_REWARDS = 'referral_rewards',
}

export enum NotificationCategory {
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  TRUST_SAFETY = 'trust_safety',
  SECURITY = 'security',
  REWARDS = 'rewards',
  IMPACT = 'impact',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

export enum NotificationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}
