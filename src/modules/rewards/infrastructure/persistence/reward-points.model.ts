import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RewardPointsDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: Number, default: 0 })
  totalPoints: number;

  @Prop({ required: true, type: Number, default: 1 })
  currentLevel: number;

  @Prop({ required: true, type: Number, default: 500 })
  pointsToNextLevel: number;

  @Prop({ required: true, type: Date })
  updatedAt: Date;
}

export const RewardPointsSchema = SchemaFactory.createForClass(RewardPointsDocument);

// Index for efficient user lookup
RewardPointsSchema.index({ userId: 1 }, { unique: true });

// Index for leaderboards
RewardPointsSchema.index({ totalPoints: -1 });
RewardPointsSchema.index({ currentLevel: -1, totalPoints: -1 });
