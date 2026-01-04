import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReferralStatus } from '../../domain/entities/referral-reward.entity';

@Schema({ timestamps: true })
export class ReferralRewardDocument extends Document {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  referrerUserId: string;

  @Prop({ required: true, type: String })
  referredUserId: string;

  @Prop({ required: true, type: String, enum: Object.values(ReferralStatus), default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Prop({ required: true, type: Number, default: 0 })
  pointsAwarded: number;

  @Prop({ required: false, type: Date })
  completedAt: Date | null;

  @Prop({ required: true, type: Date })
  createdAt: Date;
}

export const ReferralRewardSchema = SchemaFactory.createForClass(ReferralRewardDocument);

// Indexes for efficient queries
ReferralRewardSchema.index({ id: 1 }, { unique: true });
ReferralRewardSchema.index({ referrerUserId: 1, createdAt: -1 }); // Referrer's referral history
ReferralRewardSchema.index({ referredUserId: 1 }, { unique: true }); // Prevent duplicate referrals for same user
ReferralRewardSchema.index({ status: 1, createdAt: -1 }); // Find pending/completed referrals
ReferralRewardSchema.index({ referrerUserId: 1, status: 1 }); // Referrer's referrals by status
ReferralRewardSchema.index({ completedAt: -1 }); // Recent completed referrals
