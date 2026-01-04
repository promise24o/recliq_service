import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BankAccountDocument extends Document {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  bankName: string;

  @Prop({ required: true, type: String })
  bankCode: string;

  @Prop({ required: true, type: String })
  accountNumber: string;

  @Prop({ required: true, type: String })
  accountName: string;

  @Prop({ required: true, type: String, enum: ['savings', 'current'] })
  type: string;

  @Prop({ required: true, type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: String })
  recipientCode?: string;

  @Prop({ required: true, type: Boolean, default: true })
  isActive: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccountDocument);

// Indexes for better query performance
BankAccountSchema.index({ userId: 1, createdAt: -1 });
BankAccountSchema.index({ userId: 1, isDefault: 1 });
BankAccountSchema.index({ userId: 1, isActive: 1 });
BankAccountSchema.index({ accountNumber: 1 });
