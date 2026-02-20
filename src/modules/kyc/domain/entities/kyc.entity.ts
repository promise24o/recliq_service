import { 
  Kyc, 
  KycTier, 
  KycStatus, 
  KycUserType, 
  BvnData, 
  DocumentData, 
  SelfieData, 
  KycLimits,
  BusinessDetails,
  BusinessNature 
} from '../types/kyc.types';

export class KycEntity implements Kyc {
  constructor(
    public id: string,
    public userId: string,
    public userType: KycUserType,
    public currentTier: KycTier,
    public status: KycStatus,
    public emailVerified: boolean,
    public documents: DocumentData[],
    public limits: KycLimits,
    public createdAt: Date,
    public updatedAt: Date,
    public bvnData?: BvnData,
    public businessDocuments: DocumentData[] = [],
    public selfie?: SelfieData,
    public businessDetails?: BusinessDetails,
    public rejectionReason?: string,
  ) {
    this.updateLimits();
  }

  // Get available tiers based on user type
  getAvailableTiers(): KycTier[] {
    switch (this.userType) {
      case KycUserType.INDIVIDUAL:
        return [KycTier.SPROUT, KycTier.BLOOM];
      case KycUserType.ENTERPRISE:
        return [KycTier.SPROUT]; // Only email verification, business docs handled separately
      case KycUserType.AGENT:
        return [KycTier.SPROUT, KycTier.BLOOM, KycTier.THRIVE];
      default:
        return [KycTier.SPROUT];
    }
  }

  // Check if user can upgrade to next tier
  canUpgradeToTier(tier: KycTier): boolean {
    const availableTiers = this.getAvailableTiers();
    if (!availableTiers.includes(tier)) {
      return false;
    }

    switch (tier) {
      case KycTier.SPROUT:
        return this.emailVerified;
      case KycTier.BLOOM:
        return this.emailVerified && !!this.bvnData;
      case KycTier.THRIVE:
        return (
          this.emailVerified && 
          !!this.bvnData && 
          this.documents.length > 0 && 
          !!this.selfie &&
          this.status === KycStatus.VERIFIED
        );
      default:
        return false;
    }
  }

  // Upgrade to next available tier
  upgradeTier(): boolean {
    const availableTiers = this.getAvailableTiers();
    const currentIndex = availableTiers.indexOf(this.currentTier);
    
    if (currentIndex < availableTiers.length - 1) {
      const nextTier = availableTiers[currentIndex + 1];
      if (this.canUpgradeToTier(nextTier)) {
        this.currentTier = nextTier;
        this.updateLimits();
        this.updatedAt = new Date();
        return true;
      }
    }
    return false;
  }

  // Set BVN data
  setBvnData(bvnData: BvnData): void {
    this.bvnData = bvnData;
    this.updatedAt = new Date();
    
    // Auto-upgrade to Bloom if eligible
    if (this.currentTier === KycTier.SPROUT && this.canUpgradeToTier(KycTier.BLOOM)) {
      this.upgradeTier();
    }
  }

  // Add document
  addDocument(document: DocumentData): void {
    this.documents.push(document);
    this.updatedAt = new Date();
    
    // Check if eligible for Thrive tier
    if (this.userType === KycUserType.AGENT && this.canUpgradeToTier(KycTier.THRIVE)) {
      this.status = KycStatus.PENDING; // Wait for admin approval
    }
  }

  // Add business document (for enterprise users)
  addBusinessDocument(document: DocumentData): void {
    if (!this.businessDocuments) {
      this.businessDocuments = [];
    }
    this.businessDocuments.push(document);
    this.updatedAt = new Date();
  }

  // Set selfie
  setSelfie(selfie: SelfieData): void {
    this.selfie = selfie;
    this.updatedAt = new Date();
    
    // Check if eligible for Thrive tier
    if (this.userType === KycUserType.AGENT && this.canUpgradeToTier(KycTier.THRIVE)) {
      this.status = KycStatus.PENDING; // Wait for admin approval
    }
  }

  // Admin approval for Thrive tier
  approveThriveTier(): void {
    if (this.userType === KycUserType.AGENT && this.status === KycStatus.PENDING) {
      this.status = KycStatus.VERIFIED;
      this.upgradeTier();
    }
  }

  // Reject KYC application
  reject(reason: string): void {
    this.status = KycStatus.REJECTED;
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  // Update limits based on current tier
  private updateLimits(): void {
    switch (this.currentTier) {
      case KycTier.SPROUT:
        this.limits = {
          dailyWithdrawal: 1000000,  // ₦1M daily withdrawal
          maxWalletBalance: 5000000,  // ₦5M max wallet balance
        };
        break;
      case KycTier.BLOOM:
        this.limits = {
          dailyWithdrawal: 5000000,  // ₦5M daily withdrawal
          maxWalletBalance: 20000000, // ₦20M max wallet balance
        };
        break;
      case KycTier.THRIVE:
        this.limits = {
          dailyWithdrawal: 10000000, // ₦10M daily withdrawal
          maxWalletBalance: 50000000, // ₦50M max wallet balance
        };
        break;
    }
  }

  // Update business details (for enterprise users)
  updateBusinessDetails(businessDetails: BusinessDetails): void {
    if (this.userType !== ('ENTERPRISE' as KycUserType)) {
      throw new Error('Business details can only be updated for enterprise users');
    }
    
    this.businessDetails = businessDetails;
    this.updatedAt = new Date();
    
    // If all requirements are met, set status to pending admin approval
    if (this.businessDocuments.length > 0 && this.businessDetails) {
      this.status = KycStatus.PENDING;
    }
  }

  // Verify email
  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
    
    // Auto-upgrade to Sprout tier
    if (this.currentTier === KycTier.SPROUT && this.canUpgradeToTier(KycTier.SPROUT)) {
      this.status = KycStatus.VERIFIED;
    }
  }
}
