import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EnvironmentalImpactDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: Number, default: 0 })
  totalKgRecycled: number;

  @Prop({ required: true, type: Number, default: 0 })
  co2SavedKg: number;

  @Prop({ required: true, type: Number, default: 0 })
  treesEquivalent: number;

  @Prop({ required: true, type: String, default: 'F' })
  carbonScore: string;

  @Prop({ required: true, type: Date })
  lastUpdatedAt: Date;
}

export const EnvironmentalImpactSchema = SchemaFactory.createForClass(EnvironmentalImpactDocument);

// Indexes for efficient queries
EnvironmentalImpactSchema.index({ userId: 1 }, { unique: true });
EnvironmentalImpactSchema.index({ totalKgRecycled: -1 }); // Leaderboard for most recycled
EnvironmentalImpactSchema.index({ co2SavedKg: -1 }); // Leaderboard for CO2 saved
EnvironmentalImpactSchema.index({ carbonScore: 1 }); // Users by carbon score
EnvironmentalImpactSchema.index({ treesEquivalent: -1 }); // Leaderboard for trees equivalent
