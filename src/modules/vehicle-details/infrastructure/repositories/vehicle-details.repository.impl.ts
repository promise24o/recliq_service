import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IVehicleDetailsRepository } from '../../domain/repositories/vehicle-details.repository';
import type { VehicleDetailsDocument } from '../persistence/vehicle-details.model';
import { UserDocument } from '../../../auth/infrastructure/persistence/user.model';

@Injectable()
export class VehicleDetailsRepository implements IVehicleDetailsRepository {
  constructor(
    @InjectModel('VehicleDetails')
    private readonly vehicleDetailsModel: Model<VehicleDetailsDocument>,
  ) {}

  async findByUserId(userId: string): Promise<VehicleDetailsDocument | null> {
    return this.vehicleDetailsModel.findOne({ userId }).exec();
  }

  async create(userId: string, data: any): Promise<VehicleDetailsDocument> {
    const vehicleDetails = new this.vehicleDetailsModel({
      userId,
      ...data,
    });
    return vehicleDetails.save();
  }

  async update(userId: string, data: any): Promise<VehicleDetailsDocument> {
    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Failed to update vehicle details');
    }
    
    return updated;
  }

  async updateStatus(userId: string, isActive: boolean, isUnderMaintenance: boolean): Promise<VehicleDetailsDocument> {
    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { $set: { isActive, isUnderMaintenance } },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Vehicle details not found');
    }
    
    return updated;
  }

  async addDocument(userId: string, document: any): Promise<VehicleDetailsDocument> {
    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { 
        $push: { documents: document },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Vehicle details not found');
    }
    
    return updated;
  }

  async updateDocumentStatus(userId: string, documentIndex: number, status: string, reason?: string): Promise<VehicleDetailsDocument> {
    const updateData: any = {
      [`documents.${documentIndex}.status`]: status,
      [`documents.${documentIndex}.verifiedAt`]: status === 'verified' ? new Date() : undefined,
      [`documents.${documentIndex}.rejectionReason`]: status === 'rejected' ? reason : undefined
    };

    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Vehicle details not found');
    }
    
    return updated;
  }

  async updateApprovalStatus(userId: string, status: string, approvedBy: string, reason?: string): Promise<VehicleDetailsDocument> {
    const updateData: any = {
      status,
      approvedBy,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.isActive = true;
    } else if (status === 'rejected') {
      updateData.rejectionReason = reason;
      updateData.isActive = false;
    }

    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updated) {
      throw new Error('Vehicle details not found');
    }

    return updated;
  }

  async updateEnterpriseEligibility(userId: string, isEligible: boolean): Promise<VehicleDetailsDocument> {
    const updated = await this.vehicleDetailsModel.findOneAndUpdate(
      { userId },
      { $set: { isEnterpriseEligible: isEligible } },
      { new: true }
    ).exec();

    if (!updated) {
      throw new Error('Vehicle details not found');
    }

    return updated;
  }

  async findByStatus(page: number, limit: number, status?: string): Promise<{ vehicles: VehicleDetailsDocument[], total: number }> {
    const skip = (page - 1) * limit;
    
    const filter = status ? { status } : {};
    
    const [vehicles, total] = await Promise.all([
      this.vehicleDetailsModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vehicleDetailsModel.countDocuments(filter).exec()
    ]);

    return { vehicles, total };
  }

  async findById(id: string): Promise<VehicleDetailsDocument | null> {
    return this.vehicleDetailsModel.findById(id).exec();
  }

  async delete(userId: string): Promise<void> {
    await this.vehicleDetailsModel.deleteOne({ userId }).exec();
  }
}
