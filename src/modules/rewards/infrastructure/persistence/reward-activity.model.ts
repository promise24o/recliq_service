import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RewardActivity, RewardActivityType } from '../../domain/entities/reward-activity.entity';

@Schema({ timestamps: true, collection: 'reward_activities' })
export class RewardActivityDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, enum: Object.values(RewardActivityType), type: String })
  type: RewardActivityType;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Number, default: 0 })
  points: number;

  @Prop({ type: 'mixed', default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;
}

export const RewardActivitySchema = SchemaFactory.createForClass(RewardActivityDocument);

// Index for efficient queries
RewardActivitySchema.index({ userId: 1, createdAt: -1 });
RewardActivitySchema.index({ userId: 1, type: 1, createdAt: -1 });
