export enum KycTier {
  SPROUT = 'sprout',      // Tier 0: Email verification only
  BLOOM = 'bloom',       // Tier 1: BVN verification
  THRIVE = 'thrive'      // Tier 2: Document verification + admin approval
}

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress'
}

export enum KycUserType {
  INDIVIDUAL = 'individual',
  ENTERPRISE = 'enterprise',
  AGENT = 'agent'
}

export enum BusinessNature {
  OFFICE = 'office',
  FACTORY = 'factory',
  ESTATE = 'estate',
  SCHOOL = 'school',
  HOTEL = 'hotel',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

export interface BvnData {
  bvn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  verifiedAt: Date;
}

export interface DocumentData {
  documentType: 'id_card' | 'passport' | 'utility_bill' | 'business_registration' | 'tax_clearance' | 'memorandum';
  documentUrl: string;
  uploadedAt: Date;
  verified?: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface SelfieData {
  selfieUrl: string;
  uploadedAt: Date;
  verified?: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface BusinessDetails {
  businessName: string;
  businessAddress: string;
  businessLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  natureOfBusiness: BusinessNature;
  businessDescription: string;
  businessEmail: string;
  businessPhone: string;
  registrationNumber?: string;
  taxIdentificationNumber?: string;
}

export interface KycLimits {
  dailyWithdrawal: number;
  maxWalletBalance: number;
}

export interface Kyc {
  id: string;
  userId: string;
  userType: KycUserType;
  currentTier: KycTier;
  status: KycStatus;
  emailVerified: boolean;
  bvnData?: BvnData;
  documents: DocumentData[];
  businessDocuments: DocumentData[];
  selfie?: SelfieData;
  limits: KycLimits;
  businessDetails?: BusinessDetails;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycVerificationInput {
  userId: string;
  userType: KycUserType;
}

export interface BvnVerificationInput {
  userId: string;
  bvn: string;
  accountNumber: string;
  bankCode: string;
}

export interface DocumentUploadInput {
  userId: string;
  documentType: 'id_card' | 'passport' | 'utility_bill' | 'business_registration' | 'tax_clearance' | 'memorandum';
  documentFile: Express.Multer.File;
}

export interface SelfieUploadInput {
  userId: string;
  selfieFile: Express.Multer.File;
}

export interface AdminApprovalInput {
  userId: string;
  approved: boolean;
  rejectionReason?: string;
}
