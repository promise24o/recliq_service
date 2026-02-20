import { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../../../shared/constants/roles';

export interface ActivityDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userRole: UserRole;
  action: 'profile_update' | 'password_change' | 'email_change' | 'phone_change' | 'photo_change' | 'notification_preferences_change' | 'pin_set' | 'pin_change' | 'biometric_enabled' | 'biometric_disabled' | 'account_verified' | 'account_suspended' | 'account_activated';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const ActivitySchema = new Schema<ActivityDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userRole: { type: String, enum: Object.values(UserRole), required: true },
  action: { 
    type: String, 
    enum: [
      'profile_update',
      'password_change', 
      'email_change',
      'phone_change',
      'photo_change',
      'notification_preferences_change',
      'pin_set',
      'pin_change',
      'biometric_enabled',
      'biometric_disabled',
      'account_verified',
      'account_suspended',
      'account_activated'
    ], 
    required: true 
  },
  description: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true, required: true },
  metadata: { type: Schema.Types.Mixed },
}, { 
  timestamps: true,
});

// Add compound index for efficient user activity queries
ActivitySchema.index({ userId: 1, createdAt: -1 });
