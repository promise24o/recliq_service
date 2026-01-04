import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class TransactionDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String, enum: [
    'earning', 'withdrawal', 'airtime_purchase', 'data_purchase', 
    'bonus', 'referral', 'penalty', 'refund'
  ]})
  type: string;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, type: String, enum: ['pending', 'successful', 'failed', 'cancelled'] })
  status: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: String })
  reference?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(TransactionDocument);

// Indexes for better query performance
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ reference: 1 });
