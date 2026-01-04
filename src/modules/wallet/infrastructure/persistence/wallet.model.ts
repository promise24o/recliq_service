import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WalletDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: Number, default: 0 })
  balance: number;

  @Prop({ required: true, type: Number, default: 0 })
  totalEarnings: number;

  @Prop({ required: true, type: Number, default: 0 })
  todayEarnings: number;
}

export const WalletSchema = SchemaFactory.createForClass(WalletDocument);

// Indexes for better query performance
WalletSchema.index({ userId: 1 }, { unique: true });
WalletSchema.index({ userId: 1, balance: 1 });
