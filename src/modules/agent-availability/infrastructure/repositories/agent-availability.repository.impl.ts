import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';
import type { AgentAvailabilityDocument } from '../persistence/agent-availability.model';

@Injectable()
export class AgentAvailabilityRepository implements IAgentAvailabilityRepository {
  constructor(
    @InjectModel('AgentAvailability')
    private readonly availabilityModel: Model<AgentAvailabilityDocument>,
    @InjectModel('User')
    private readonly userModel: Model<any>,
  ) {}

  async findByUserId(userId: string): Promise<AgentAvailabilityDocument | null> {
    return this.availabilityModel.findOne({ userId }).exec();
  }

  async create(userId: string, data: any): Promise<AgentAvailabilityDocument> {
    // Fetch user details to get agentId and agentName
    const user = await this.userModel.findById(userId).select('name email').exec();
    if (!user) {
      throw new Error('User not found');
    }

    const availability = new this.availabilityModel({
      userId,
      agentId: userId,
      agentName: user.name,
      ...data,
    });
    return availability.save();
  }

  async update(userId: string, data: any): Promise<AgentAvailabilityDocument> {
    const updated = await this.availabilityModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Failed to update availability');
    }
    
    return updated;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<AgentAvailabilityDocument> {
    const updated = await this.availabilityModel.findOneAndUpdate(
      { userId },
      { $set: { isOnline } },
      { new: true, upsert: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Failed to update availability');
    }
    
    return updated;
  }

  async updateLocation(userId: string, lat: number, lng: number): Promise<AgentAvailabilityDocument> {
    const updated = await this.availabilityModel.findOneAndUpdate(
      { userId },
      { $set: { currentLocation: { lat, lng } } },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new Error('Availability not found');
    }
    
    return updated;
  }

  async findOnlineAgentsByZone(city: string, zone: string): Promise<AgentAvailabilityDocument[]> {
    return this.availabilityModel.find({
      isOnline: true,
      city,
      zone,
    }).exec();
  }

  async delete(userId: string): Promise<void> {
    await this.availabilityModel.deleteOne({ userId }).exec();
  }
}
