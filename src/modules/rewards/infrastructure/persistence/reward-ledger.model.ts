import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RewardType } from '../../domain/entities/reward-ledger.entity';

@Schema({ timestamps: true })
export class RewardLedgerDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String, enum: Object.values(RewardType) })
  type: RewardType;

  @Prop({ required: true, type: Number })
  points: number;

  @Prop({ required: true, type: String })
  referenceId: string; // pickupId, referralId, etc.

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Date })
  createdAt: Date;
}

export const RewardLedgerSchema = SchemaFactory.createForClass(RewardLedgerDocument);

// Indexes for efficient queries
RewardLedgerSchema.index({ userId: 1, createdAt: -1 }); // User's activity feed
RewardLedgerSchema.index({ userId: 1, type: 1, createdAt: -1 }); // User's activity by type
RewardLedgerSchema.index({ referenceId: 1 }, { unique: true }); // Prevent duplicate rewards for same event
RewardLedgerSchema.index({ createdAt: -1 }); // Recent activity across all users
RewardLedgerSchema.index({ type: 1, createdAt: -1 }); // Activity by type across all users

// Compound index for preventing duplicate rewards
RewardLedgerSchema.index({ userId: 1, type: 1, referenceId: 1 }, { unique: true });
