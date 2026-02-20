import { 
  Kyc, 
  KycTier, 
  KycStatus, 
  KycUserType, 
  BvnData, 
  DocumentData, 
  SelfieData, 
  KycLimits,
  BusinessDetails 
} from '../types/kyc.types';

export interface IKycRepository {
  // CRUD operations
  create(kyc: Kyc): Promise<Kyc>;
  findById(userId: string): Promise<Kyc | null>;
  findByUserId(userId: string): Promise<Kyc | null>;
  update(kyc: Kyc): Promise<Kyc>;
  delete(userId: string): Promise<void>;

  // KYC specific operations
  findByUserType(userType: KycUserType): Promise<Kyc[]>;
  findPendingVerifications(): Promise<Kyc[]>;
  findByTier(tier: string): Promise<Kyc[]>;
  findByFilter(filter: any, skip?: number, limit?: number): Promise<Kyc[]>;
  countByFilter(filter: any): Promise<number>;

  // BVN verification
  updateBvnData(userId: string, bvnData: any): Promise<Kyc>;

  // Document management
  addDocument(userId: string, document: any): Promise<Kyc>;
  addBusinessDocument(userId: string, document: any): Promise<Kyc>;
  setSelfie(userId: string, selfie: any): Promise<Kyc>;

  // Business details operations
  updateBusinessDetails(userId: string, businessDetails: BusinessDetails): Promise<Kyc>;

  // Admin operations
  approveKyc(userId: string): Promise<Kyc>;
  rejectKyc(userId: string, reason: string): Promise<Kyc>;

  // Statistics
  getKycStats(): Promise<{
    total: number;
    sprout: number;
    bloom: number;
    thrive: number;
    pending: number;
  }>;
}
