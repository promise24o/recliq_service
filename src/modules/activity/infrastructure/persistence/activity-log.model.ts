import { Schema, Document, Types } from 'mongoose';

export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  TWO_FACTOR_CHANGE = 'two_factor_change',
  PROFILE_UPDATE = 'profile_update',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  OVERRIDE = 'override',
  ESCALATION = 'escalation',
  SENSITIVE_VIEW = 'sensitive_view',
  SETTING_CHANGE = 'setting_change',
  SESSION_TERMINATED = 'session_terminated',
  FAILED_LOGIN = 'failed_login',
  USER_ACTION = 'user_action',
  AGENT_ACTION = 'agent_action',
  FINANCE_ACTION = 'finance_action',
  ZONE_ACTION = 'zone_action',
  PRICING_ACTION = 'pricing_action'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ActivitySource {
  WEB = 'web',
  API = 'api',
  MOBILE = 'mobile',
  SYSTEM = 'system'
}

export enum ActivityOutcome {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface ActivityLogDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  timestamp: Date;
  action: ActivityAction;
  actionLabel: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  outcome: ActivityOutcome;
  riskLevel: RiskLevel;
  source: ActivitySource;
  ipAddress: string;
  device: string;
  location: string;
  beforeState?: string;
  afterState?: string;
  reason?: string;
  auditRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    action: { 
      type: String, 
      required: true, 
      enum: [
        'login', 'logout', 'password_change', 'two_factor_change', 'profile_update',
        'approval', 'rejection', 'override', 'escalation', 'sensitive_view',
        'setting_change', 'session_terminated', 'failed_login', 'user_action',
        'agent_action', 'finance_action', 'zone_action', 'pricing_action'
      ],
      index: true
    },
    actionLabel: { type: String, required: true },
    description: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    entityName: { type: String, required: true },
    outcome: { 
      type: String, 
      required: true, 
      enum: ['success', 'failed', 'pending'],
      index: true
    },
    riskLevel: { 
      type: String, 
      required: true, 
      enum: ['low', 'medium', 'high', 'critical'],
      index: true
    },
    source: { 
      type: String, 
      required: true, 
      enum: ['web', 'api', 'mobile', 'system'] 
    },
    ipAddress: { type: String, required: true },
    device: { type: String, required: true },
    location: { type: String, required: true },
    beforeState: { type: String },
    afterState: { type: String },
    reason: { type: String },
    auditRef: { type: String }
  },
  {
    timestamps: true,
    collection: 'activity_logs'
  }
);

// Create indexes for frequent queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ riskLevel: 1, timestamp: -1 });
