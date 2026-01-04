import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class NotificationDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String, enum: [
    'wallet_credit', 'wallet_debit', 'withdrawal_success', 'withdrawal_pending', 'withdrawal_failed',
    'pickup_requested', 'agent_assigned', 'agent_arriving', 'material_weighed', 'payment_confirmed',
    'pickup_cancelled', 'pickup_rescheduled', 'agent_verified', 'rate_agent', 'report_resolved',
    'pickup_issue', 'login_detected', 'new_device_login', 'password_changed', 'suspicious_activity',
    'kyc_approved', 'kyc_rejected', 'milestone_reached', 'recycling_streak', 'bonus_earned',
    'leaderboard_update', 'co2_saved', 'monthly_recycling', 'community_impact', 'maintenance_notice',
    'new_feature', 'policy_update', 'limited_time_bonus', 'partner_offer', 'referral_rewards'
  ]})
  type: string;

  @Prop({ required: true, type: String, enum: ['finance', 'operations', 'trust_safety', 'security', 'rewards', 'impact', 'system', 'marketing'] })
  category: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  message: string;

  @Prop({ required: true, type: String, enum: ['high', 'medium', 'low'], default: 'medium' })
  priority: string;

  @Prop({ required: true, type: Boolean, default: false })
  read: boolean;

  @Prop({ type: String })
  actionUrl?: string;

  @Prop({ type: String })
  actionText?: string;

  @Prop({ type: String })
  imageUrl?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(NotificationDocument);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, category: 1 });
NotificationSchema.index({ userId: 1, priority: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days for non-persistent notifications
