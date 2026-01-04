import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Badge criteria interface
export interface BadgeCriteriaDocument {
  type: 'FIRST_RECYCLE' | 'WEIGHT_THRESHOLD' | 'PICKUP_COUNT' | 'STREAK_WEEKS' | 'REFERRAL_COUNT';
  value: number;
}

@Schema({ timestamps: true })
export class BadgeDocument extends Document {
  @Prop({ required: true, type: String })
  badgeId: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Object })
  criteria: BadgeCriteriaDocument;

  @Prop({ required: true, type: String })
  icon: string;

  @Prop({ required: true, type: Boolean, default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class UserBadgeDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  badgeId: string;

  @Prop({ required: true, type: Date })
  earnedAt: Date;

  @Prop({ required: true, type: String })
  sourceEventId: string; // The ledger entry that triggered this badge
}

export const BadgeSchema = SchemaFactory.createForClass(BadgeDocument);
export const UserBadgeSchema = SchemaFactory.createForClass(UserBadgeDocument);

// Badge indexes
BadgeSchema.index({ badgeId: 1 }, { unique: true });
BadgeSchema.index({ isActive: 1 });
BadgeSchema.index({ 'criteria.type': 1 });

// UserBadge indexes
UserBadgeSchema.index({ userId: 1, earnedAt: -1 }); // User's badges in order earned
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true }); // Prevent duplicate badges
UserBadgeSchema.index({ badgeId: 1 }); // Find all users who earned a specific badge
UserBadgeSchema.index({ earnedAt: -1 }); // Recent badge awards
