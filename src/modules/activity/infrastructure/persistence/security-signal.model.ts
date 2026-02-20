import { Schema, Document, Types } from 'mongoose';

export enum SecuritySignalType {
  UNUSUAL_TIME = 'unusual_time',
  NEW_DEVICE = 'new_device',
  FAILED_LOGIN = 'failed_login',
  LOCATION_ANOMALY = 'location_anomaly'
}

export enum SecuritySignalSeverity {
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface SecuritySignalDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  type: SecuritySignalType;
  severity: SecuritySignalSeverity;
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const SecuritySignalSchema = new Schema<SecuritySignalDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      required: true, 
      enum: ['unusual_time', 'new_device', 'failed_login', 'location_anomaly'],
      index: true
    },
    severity: { 
      type: String, 
      required: true, 
      enum: ['warning', 'critical'],
      index: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    acknowledged: { type: Boolean, required: true, default: false, index: true },
    acknowledgedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'security_signals'
  }
);

// Create indexes for frequent queries
SecuritySignalSchema.index({ userId: 1, acknowledged: 1, timestamp: -1 });
SecuritySignalSchema.index({ userId: 1, severity: 1, timestamp: -1 });
