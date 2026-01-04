import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StreakDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: Number, default: 0 })
  currentStreakCount: number;

  @Prop({ required: true, type: Number, default: 0 })
  bestStreak: number;

  @Prop({ required: false, type: Date })
  lastRecycleDate: Date | null;

  @Prop({ required: true, type: Number, default: 7 })
  streakInterval: number; // in days

  @Prop({ required: true, type: Boolean, default: false })
  isActive: boolean;

  @Prop({ required: true, type: Date })
  updatedAt: Date;
}

export const StreakSchema = SchemaFactory.createForClass(StreakDocument);

// Indexes for efficient queries
StreakSchema.index({ userId: 1 }, { unique: true });
StreakSchema.index({ currentStreakCount: -1 }); // Leaderboard for current streaks
StreakSchema.index({ bestStreak: -1 }); // Leaderboard for best streaks
StreakSchema.index({ isActive: 1, currentStreakCount: -1 }); // Active streaks leaderboard
StreakSchema.index({ lastRecycleDate: -1 }); // Users who recently recycled
