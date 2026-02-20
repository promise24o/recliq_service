import { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../../../shared/constants/roles';
import { AdminSubRole } from '../../../../shared/constants/admin-sub-roles';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  FLAGGED_FOR_REVIEW = 'flagged_for_review',
  INACTIVE = 'inactive'
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  adminSubRole?: AdminSubRole;
  isVerified: boolean;
  status: UserStatus;
  password?: string;
  pin?: string;
  biometricEnabled: boolean;
  profilePhoto?: string;
  referralCode?: string;
  city?: string;
  zone?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  notifications: {
    priceUpdates: boolean;
    loginEmails: boolean;
    // Admin notification preferences
    loginAlerts?: {
      email: boolean;
      inApp: boolean;
    };
    passwordChanges?: {
      email: boolean;
      inApp: boolean;
    };
    failedLoginAttempts?: {
      email: boolean;
      inApp: boolean;
    };
    pickupEscalations?: {
      email: boolean;
      inApp: boolean;
    };
    agentStatusChanges?: {
      email: boolean;
      inApp: boolean;
    };
    paymentApprovals?: {
      email: boolean;
      inApp: boolean;
    };
    floatAlerts?: {
      email: boolean;
      inApp: boolean;
    };
    systemUpdates?: {
      email: boolean;
      inApp: boolean;
    };
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
  status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
  password: { type: String, required: true },
  pin: { type: String },
  biometricEnabled: { type: Boolean, default: false },
  profilePhoto: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  city: { type: String },
  zone: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String }
  },
  notifications: {
    priceUpdates: { type: Boolean, default: false },
    loginEmails: { type: Boolean, default: false },
    // Admin notification preferences
    loginAlerts: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    passwordChanges: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    failedLoginAttempts: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    pickupEscalations: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    agentStatusChanges: {
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    paymentApprovals: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    floatAlerts: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    systemUpdates: {
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
  },
  otp: { type: String },
  otpExpiresAt: { type: Date },
}, { timestamps: true });