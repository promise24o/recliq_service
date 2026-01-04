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

  @Prop({ type: String, unique: true, sparse: true })
  accountNumber: string | null;

  @Prop({ type: String })
  accountName: string | null;

  @Prop({ type: Number, default: 0 })
  lastWithdrawnAmount: number;

  @Prop({ type: Date })
  lastTransactionDate: Date | null;
}

export const WalletSchema = SchemaFactory.createForClass(WalletDocument);

// Indexes for better query performance
WalletSchema.index({ userId: 1 }, { unique: true });
WalletSchema.index({ userId: 1, balance: 1 });
WalletSchema.index({ accountNumber: 1 }, { unique: true, sparse: true });
