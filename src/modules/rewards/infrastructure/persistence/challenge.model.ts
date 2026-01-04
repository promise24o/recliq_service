import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChallengeGoalType } from '../../domain/entities/challenge.entity';

@Schema({ timestamps: true })
export class ChallengeDocument extends Document {
  @Prop({ required: true, type: String })
  challengeId: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String, enum: Object.values(ChallengeGoalType) })
  goalType: ChallengeGoalType;

  @Prop({ required: true, type: Number })
  targetValue: number;

  @Prop({ required: true, type: Number })
  rewardPoints: number;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ required: true, type: Boolean, default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class UserChallengeProgressDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  challengeId: string;

  @Prop({ required: true, type: Number, default: 0 })
  currentProgress: number;

  @Prop({ required: true, type: Boolean, default: false })
  completed: boolean;

  @Prop({ required: false, type: Date })
  completedAt: Date | null;

  @Prop({ required: true, type: Date })
  updatedAt: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(ChallengeDocument);
export const UserChallengeProgressSchema = SchemaFactory.createForClass(UserChallengeProgressDocument);

// Challenge indexes
ChallengeSchema.index({ challengeId: 1 }, { unique: true });
ChallengeSchema.index({ isActive: 1, startDate: 1, endDate: 1 }); // Active challenges
ChallengeSchema.index({ goalType: 1 });
ChallengeSchema.index({ startDate: 1, endDate: 1 });

// UserChallengeProgress indexes
UserChallengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
UserChallengeProgressSchema.index({ userId: 1, completed: 1 }); // User's completed vs active challenges
UserChallengeProgressSchema.index({ challengeId: 1, completed: 1 }); // Challenge completion stats
UserChallengeProgressSchema.index({ completedAt: -1 }); // Recent completions
UserChallengeProgressSchema.index({ userId: 1, updatedAt: -1 }); // User's recent activity
