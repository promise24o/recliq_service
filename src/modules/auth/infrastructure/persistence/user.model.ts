import { Schema, Document } from 'mongoose';
import { UserRole } from '../../../../shared/constants/roles';

export interface UserDocument extends Document {
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiresAt: { type: Date },
}, { timestamps: true });