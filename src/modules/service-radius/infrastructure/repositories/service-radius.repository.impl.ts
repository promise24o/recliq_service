import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IServiceRadiusRepository } from '../../domain/repositories/service-radius.repository';
import { ServiceRadiusDocument } from '../persistence/service-radius.model';

@Injectable()
export class ServiceRadiusRepository implements IServiceRadiusRepository {
  constructor(
    @InjectModel('ServiceRadius')
    private readonly serviceRadiusModel: Model<ServiceRadiusDocument>,
  ) {}

  async findByUserId(userId: string): Promise<ServiceRadiusDocument | null> {
    return this.serviceRadiusModel.findOne({ userId }).exec();
  }

  async create(userId: string, data: Partial<ServiceRadiusDocument>): Promise<ServiceRadiusDocument> {
    const serviceRadius = new this.serviceRadiusModel({
      userId,
      ...data,
    });
    return serviceRadius.save();
  }

  async update(userId: string, data: Partial<ServiceRadiusDocument>): Promise<ServiceRadiusDocument> {
    const updated = await this.serviceRadiusModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Failed to update service radius');
    }
    
    return updated;
  }

  async delete(userId: string): Promise<void> {
    await this.serviceRadiusModel.deleteOne({ userId }).exec();
  }

  async findAgentsInRadius(
    location: { latitude: number; longitude: number },
    radiusKm: number
  ): Promise<ServiceRadiusDocument[]> {
    const radiusInMeters = radiusKm * 1000;
    
    return this.serviceRadiusModel.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    }).exec();
  }

  async findAgentsByZoneId(zoneId: string): Promise<ServiceRadiusDocument[]> {
    return this.serviceRadiusModel.find({
      serviceZones: zoneId,
    }).exec();
  }
}
