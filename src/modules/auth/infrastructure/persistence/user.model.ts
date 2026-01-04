import { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  adminSubRole?: AdminSubRole;
  isVerified: boolean;
  password?: string;
  pin?: string;
  biometricEnabled: boolean;
  profilePhoto?: string;
  referralCode?: string;
  notifications: {
    priceUpdates: boolean;
    loginEmails: boolean;
  };
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
  adminSubRole: { type: String, enum: Object.values(AdminSubRole) },
  isVerified: { type: Boolean, default: false },
  password: { type: String, required: true },
  pin: { type: String },
  biometricEnabled: { type: Boolean, default: false },
  profilePhoto: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  notifications: {
    priceUpdates: { type: Boolean, default: false },
    loginEmails: { type: Boolean, default: false },
  },
  otp: { type: String },
  otpExpiresAt: { type: Date },
}, { timestamps: true });