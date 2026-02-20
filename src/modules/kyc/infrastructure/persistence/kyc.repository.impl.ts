import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { KycSchema } from './kyc.model';
import { KycEntity } from '../../domain/entities/kyc.entity';
import { 
  IKycRepository
} from '../../domain/repositories/kyc.repository';
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
} from '../../domain/types/kyc.types';

@Injectable()
export class KycRepositoryImpl implements IKycRepository {
  constructor(
    @InjectModel('Kyc') private kycModel: Model<Document>,
  ) {}

  async create(kyc: Kyc): Promise<Kyc> {
    const createdKyc = new this.kycModel(kyc);
    const savedKyc = await createdKyc.save();
    return this.toEntity(savedKyc);
  }

  async findById(userId: string): Promise<Kyc | null> {
    const kycDoc = await this.kycModel.findOne({ userId });
    return kycDoc ? this.toEntity(kycDoc) : null;
  }

  async findByUserId(userId: string): Promise<Kyc | null> {
    return this.findById(userId);
  }

  async update(kyc: Kyc): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId: kyc.userId },
      this.toDocument(kyc),
      { new: true, upsert: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async delete(userId: string): Promise<void> {
    await this.kycModel.deleteOne({ userId }).exec();
  }

  async findByUserType(userType: KycUserType): Promise<Kyc[]> {
    const kycDocs = await this.kycModel.find({ userType }).exec();
    return kycDocs.map(doc => this.toEntity(doc));
  }

  async findPendingVerifications(): Promise<Kyc[]> {
    const kycDocs = await this.kycModel.find({ 
      status: KycStatus.PENDING 
    }).exec();
    return kycDocs.map(doc => this.toEntity(doc));
  }

  async findByTier(tier: string): Promise<Kyc[]> {
    const kycDocs = await this.kycModel.find({ 
      currentTier: tier 
    }).exec();
    return kycDocs.map(doc => this.toEntity(doc));
  }

  async updateBvnData(userId: string, bvnData: BvnData): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          bvnData,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async addDocument(userId: string, document: DocumentData): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $push: { documents: document },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async addBusinessDocument(userId: string, document: DocumentData): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $push: { businessDocuments: document },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async setSelfie(userId: string, selfie: SelfieData): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          selfie,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async approveKyc(userId: string): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          status: KycStatus.VERIFIED,
          currentTier: KycTier.THRIVE,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async rejectKyc(userId: string, reason: string): Promise<Kyc> {
    const updatedKyc = await this.kycModel.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          status: KycStatus.REJECTED,
          rejectionReason: reason,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedKyc) {
      throw new Error('KYC record not found');
    }
    
    return this.toEntity(updatedKyc);
  }

  async findByFilter(filter: any, skip: number = 0, limit: number = 10): Promise<Kyc[]> {
    const kycs = await this.kycModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    
    return kycs.map(kyc => this.toEntity(kyc));
  }

  async countByFilter(filter: any): Promise<number> {
    return this.kycModel.countDocuments(filter).exec();
  }

  async getKycStats(): Promise<{
    total: number;
    sprout: number;
    bloom: number;
    thrive: number;
    pending: number;
  }> {
    const stats = await this.kycModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sprout: {
            $sum: { $cond: [{ $eq: ['$currentTier', KycTier.SPROUT] }, 1, 0] }
          },
          bloom: {
            $sum: { $cond: [{ $eq: ['$currentTier', KycTier.BLOOM] }, 1, 0] }
          },
          thrive: {
            $sum: { $cond: [{ $eq: ['$currentTier', KycTier.THRIVE] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', KycStatus.PENDING] }, 1, 0] }
          }
        }
      }
    ]).exec();
    
    return stats[0] || {
      total: 0,
      sprout: 0,
      bloom: 0,
      thrive: 0,
      pending: 0,
    };
  }

  // Update business details
  async updateBusinessDetails(userId: string, businessDetails: BusinessDetails): Promise<Kyc> {
    const kyc = await this.kycModel.findOne({ userId }).exec();
    if (!kyc) {
      throw new Error('KYC record not found');
    }

    (kyc as any).businessDetails = businessDetails;
    (kyc as any).updatedAt = new Date();

    // If business details are submitted, set status to pending admin approval
    if ((kyc as any).businessDetails) {
      (kyc as any).status = KycStatus.PENDING;
    }

    const updatedKyc = await kyc.save();
    return this.toEntity(updatedKyc);
  }

  private toEntity(doc: Document): KycEntity {
    return new KycEntity(
      (doc as any)._id.toString(),
      (doc as any).userId,
      (doc as any).userType.toUpperCase() as any,
      (doc as any).currentTier.toUpperCase() as any,
      (doc as any).status.toUpperCase() as any,
      (doc as any).emailVerified,
      (doc as any).documents,
      (doc as any).limits,
      (doc as any).createdAt,
      (doc as any).updatedAt,
      (doc as any).bvnData,
      (doc as any).businessDocuments || [],
      (doc as any).selfie,
      (doc as any).businessDetails,
      (doc as any).rejectionReason,
    );
  }

  private toDocument(kyc: Kyc): any {
    return {
      userId: kyc.userId,
      userType: kyc.userType.toLowerCase(),
      currentTier: kyc.currentTier.toLowerCase(),
      status: kyc.status.toLowerCase(),
      emailVerified: kyc.emailVerified,
      bvnData: kyc.bvnData,
      documents: kyc.documents,
      selfie: kyc.selfie,
      businessDocuments: kyc.businessDocuments,
      limits: kyc.limits,
      businessDetails: kyc.businessDetails,
      rejectionReason: kyc.rejectionReason,
    };
  }
}
