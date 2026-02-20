import { Schema, Document, Types } from 'mongoose';
import { 
  KycTier, 
  KycStatus, 
  KycUserType, 
  BvnData, 
  DocumentData, 
  SelfieData, 
  KycLimits 
} from '../../domain/types/kyc.types';

export interface KycDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  userType: string;
  currentTier: string;
  status: string;
  emailVerified: boolean;
  bvnData?: BvnData;
  documents: DocumentData[];
  selfie?: SelfieData;
  businessDocuments?: DocumentData[];
  businessDetails?: {
    businessName?: string;
    businessAddress?: string;
    businessLocation?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
    natureOfBusiness?: string;
    businessDescription?: string;
    businessEmail?: string;
    businessPhone?: string;
    registrationNumber?: string;
    taxIdentificationNumber?: string;
  };
  limits: KycLimits;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const KycSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  userType: { 
    type: String, 
    enum: ['individual', 'enterprise', 'agent'], 
    required: true 
  },
  currentTier: { 
    type: String, 
    enum: ['sprout', 'bloom', 'thrive'], 
    default: 'sprout' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'in_progress'], 
    default: 'pending' 
  },
  emailVerified: { type: Boolean, default: false },
  bvnData: {
    bvn: String,
    firstName: String,
    lastName: String,
    dateOfBirth: String,
    phoneNumber: String,
    verifiedAt: Date,
  },
  documents: [{
    documentType: {
      type: String,
      enum: ['id_card', 'passport', 'utility_bill', 'business_registration', 'tax_clearance', 'memorandum'],
      required: true
    },
    documentUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    rejectionReason: String,
  }],
  selfie: {
    selfieUrl: { type: String },
    uploadedAt: { type: Date },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    rejectionReason: String,
  },
  businessDocuments: [{
    documentType: {
      type: String,
      enum: ['business_registration', 'tax_clearance', 'memorandum'],
      required: true
    },
    documentUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    rejectionReason: String,
  }],
  limits: {
    dailyWithdrawal: { type: Number, required: true, default: 1000000 },
    maxWalletBalance: { type: Number, required: true, default: 5000000 },
  },
  businessDetails: {
    businessName: { type: String, required: false },
    businessAddress: { type: String, required: false },
    businessLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    natureOfBusiness: { 
      type: String, 
      enum: ['office', 'factory', 'estate', 'school', 'hotel', 'retail', 'manufacturing', 'healthcare', 'government', 'other'],
      required: false 
    },
    businessDescription: { type: String, required: false },
    businessEmail: { type: String, required: false },
    businessPhone: { type: String, required: false },
    registrationNumber: { type: String, required: false },
    taxIdentificationNumber: { type: String, required: false },
  },
  rejectionReason: String,
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      (ret as any).id = (ret._id as Types.ObjectId).toString();
      (ret as any)._id = undefined;
      (ret as any).__v = undefined;
      return ret;
    }
  }
});

// Indexes for better performance
KycSchema.index({ userId: 1 });
KycSchema.index({ userType: 1 });
KycSchema.index({ currentTier: 1 });
KycSchema.index({ status: 1 });
KycSchema.index({ createdAt: -1 });
