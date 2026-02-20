import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CityDocument } from './city.model';
import { City } from '../../domain/types/zone.types';
import { ICityRepository } from '../../domain/repositories/city.repository';

@Injectable()
export class CityRepositoryImpl implements ICityRepository {
  constructor(
    @InjectModel('City')
    private readonly cityModel: Model<CityDocument>,
  ) {}

  async create(cityData: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City> {
    const city = new this.cityModel(cityData);
    const savedCity = await city.save();
    return this.toEntity(savedCity);
  }

  async findById(id: string): Promise<City | null> {
    const city = await this.cityModel.findById(id);
    return city ? this.toEntity(city) : null;
  }

  async findByName(name: string): Promise<City | null> {
    const city = await this.cityModel.findOne({ name });
    return city ? this.toEntity(city) : null;
  }

  async findAll(filters?: {
    state?: string;
    isActive?: boolean;
  }): Promise<City[]> {
    const query: any = {};
    
    if (filters?.state) query.state = filters.state;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    const cities = await this.cityModel.find(query).sort({ name: 1 });
    return cities.map(city => this.toEntity(city));
  }

  async update(id: string, updates: Partial<City>): Promise<City> {
    const city = await this.cityModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );
    
    if (!city) {
      throw new Error('City not found');
    }
    
    return this.toEntity(city);
  }

  async delete(id: string): Promise<void> {
    await this.cityModel.findByIdAndDelete(id);
  }

  async getCityStats(cityId: string): Promise<{
    totalZones: number;
    activeZones: number;
    totalAgents: number;
    avgCoverage: number;
  }> {
    // This would typically join with zones collection
    // For now, return placeholder stats
    return {
      totalZones: 0,
      activeZones: 0,
      totalAgents: 0,
      avgCoverage: 0,
    };
  }

  async getCitiesWithZoneCount(): Promise<Array<City & { zoneCount: number }>> {
    // This would typically use aggregation with zones collection
    // For now, return cities with zone count 0
    const cities = await this.cityModel.find({ isActive: true }).sort({ name: 1 });
    
    return cities.map(city => ({
      ...this.toEntity(city),
      zoneCount: 0,
    }));
  }

  private toEntity(doc: CityDocument): City {
    return {
      id: doc._id.toString(),
      name: doc.name,
      state: doc.state,
      center: doc.center,
      isActive: doc.isActive,
      timezone: doc.timezone,
      createdBy: doc.createdBy,
      lastChangedBy: doc.lastChangedBy,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
