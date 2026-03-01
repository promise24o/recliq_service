import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RiskEventType } from '../../domain/types/risk.types';

@Schema({ timestamps: true })
export class RiskEventDocument extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, enum: RiskEventType })
  type: RiskEventType;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ required: true })
  actor: string;

  @Prop({ required: true })
  actorId: string;

  @Prop({ type: Date })
  expires?: Date;

  @Prop({ type: Boolean, default: false })
  resolved?: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const RiskEventSchema = SchemaFactory.createForClass(RiskEventDocument);

// Create indexes for better query performance
RiskEventSchema.index({ userId: 1, timestamp: -1 });
RiskEventSchema.index({ type: 1, timestamp: -1 });
RiskEventSchema.index({ timestamp: -1 });
RiskEventSchema.index({ expires: 1 });
RiskEventSchema.index({ resolved: 1 });
