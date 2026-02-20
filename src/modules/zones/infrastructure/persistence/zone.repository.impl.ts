import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ZoneDocument } from './zone.model';
import { Zone, ZoneSummary, ZoneChangeEvent, ZoneExpansionInsight } from '../../domain/types/zone.types';
import { IZoneRepository } from '../../domain/repositories/zone.repository';

@Injectable()
export class ZoneRepositoryImpl implements IZoneRepository {
  constructor(
    @InjectModel('Zone')
    private readonly zoneModel: Model<ZoneDocument>,
  ) {}

  async create(zoneData: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone> {
    const zone = new this.zoneModel(zoneData);
    const savedZone = await zone.save();
    return this.toEntity(savedZone);
  }

  async findById(id: string): Promise<Zone | null> {
    const zone = await this.zoneModel.findById(id);
    return zone ? this.toEntity(zone) : null;
  }

  async findAll(filters?: {
    city?: string;
    state?: string;
    status?: string;
    coverageLevel?: string;
  }): Promise<Zone[]> {
    const query: any = {};
    
    if (filters?.city) query.city = filters.city;
    if (filters?.state) query.state = filters.state;
    if (filters?.status) query.status = filters.status;
    if (filters?.coverageLevel) query.coverageLevel = filters.coverageLevel;

    const zones = await this.zoneModel.find(query).sort({ city: 1, name: 1 });
    return zones.map(zone => this.toEntity(zone));
  }

  async findByCity(city: string): Promise<Zone[]> {
    const docs = await this.zoneModel.find({ city }).exec();
    return docs.map(doc => this.toEntity(doc));
  }

  async findByNameAndCity(name: string, city: string): Promise<Zone | null> {
    const doc = await this.zoneModel.findOne({ name, city }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async update(id: string, updates: Partial<Zone>): Promise<Zone> {
    const zone = await this.zoneModel.findByIdAndUpdate(
      id,
      { $set: updates, $inc: { version: 1 } },
      { new: true }
    );
    
    if (!zone) {
      throw new Error('Zone not found');
    }
    
    return this.toEntity(zone);
  }

  async delete(id: string): Promise<void> {
    await this.zoneModel.findByIdAndDelete(id);
  }

  async getSummary(): Promise<ZoneSummary> {
    const [
      totalCities,
      activeZones,
      totalAgents,
      lowCoverageZones,
      avgPickupsResult,
      avgSlaResult
    ] = await Promise.all([
      this.zoneModel.distinct('city').then(cities => cities.length),
      this.zoneModel.countDocuments({ status: 'active' }),
      this.zoneModel.aggregate([{ $group: { _id: null, total: { $sum: '$totalAgents' } } }]),
      this.zoneModel.countDocuments({ coverageLevel: { $in: ['low', 'critical'] } }),
      this.zoneModel.aggregate([{ $group: { _id: null, avg: { $avg: '$avgPickupsPerDay' } } }]),
      this.zoneModel.aggregate([{ $group: { _id: null, avg: { $avg: '$performance.slaCompliancePercent' } } }])
    ]);

    return {
      citiesCovered: totalCities,
      activeZones,
      agentsAssigned: totalAgents[0]?.total || 0,
      lowCoverageZones,
      avgPickupsPerZone: Math.round(avgPickupsResult[0]?.avg || 0),
      avgSlaPerformancePercent: Math.round(avgSlaResult[0]?.avg || 0),
    };
  }

  async getChangeHistory(zoneId?: string): Promise<ZoneChangeEvent[]> {
    // This would typically come from a separate audit log collection
    // For now, return empty array as this is a placeholder implementation
    return [];
  }

  async getExpansionInsights(): Promise<ZoneExpansionInsight[]> {
    const zones = await this.zoneModel.find({
      $or: [
        { 'performance.utilizationPercent': { $gte: 85 } },
        { coverageGapPercent: { $gte: 40 } },
        { status: 'inactive' }
      ]
    });

    return zones.map(zone => {
      let insight: ZoneExpansionInsight;
      
      if (zone.status === 'inactive') {
        insight = {
          zoneId: zone._id.toString(),
          zoneName: zone.name,
          city: zone.city,
          metric: 'Status',
          value: 0,
          recommendation: `Zone inactive. Need minimum agents before activation.`,
          severity: 'critical'
        };
      } else if (zone.coverageGapPercent >= 50) {
        insight = {
          zoneId: zone._id.toString(),
          zoneName: zone.name,
          city: zone.city,
          metric: 'Coverage Gap',
          value: zone.coverageGapPercent,
          recommendation: `Critical coverage gap. Immediate agent recruitment required.`,
          severity: 'critical'
        };
      } else if (zone.performance.utilizationPercent >= 90) {
        insight = {
          zoneId: zone._id.toString(),
          zoneName: zone.name,
          city: zone.city,
          metric: 'Utilization',
          value: zone.performance.utilizationPercent,
          recommendation: `High utilization. Consider zone expansion or agent addition.`,
          severity: 'info'
        };
      } else {
        insight = {
          zoneId: zone._id.toString(),
          zoneName: zone.name,
          city: zone.city,
          metric: 'Coverage Gap',
          value: zone.coverageGapPercent,
          recommendation: `Moderate coverage gap. Monitor and consider incentives.`,
          severity: 'warning'
        };
      }
      
      return insight;
    });
  }

  async updatePerformance(id: string, performance: Partial<Zone['performance']>): Promise<void> {
    await this.zoneModel.findByIdAndUpdate(id, {
      $set: { 'performance': performance }
    });
  }

  async getZoneStats(zoneId: string): Promise<{
    totalPickups: number;
    totalDropoffs: number;
    agentUtilization: number;
    slaCompliance: number;
  }> {
    const zone = await this.zoneModel.findById(zoneId);
    if (!zone) {
      throw new Error('Zone not found');
    }

    return {
      totalPickups: zone.avgPickupsPerDay * 30, // Monthly estimate
      totalDropoffs: zone.avgDropoffsPerDay * 30, // Monthly estimate
      agentUtilization: zone.performance.utilizationPercent,
      slaCompliance: zone.performance.slaCompliancePercent,
    };
  }

  private toEntity(doc: ZoneDocument): Zone {
    return {
      id: doc._id.toString(),
      name: doc.name,
      city: doc.city,
      state: doc.state,
      description: doc.description,
      boundary: doc.boundary,
      status: doc.status,
      coverageLevel: doc.coverageLevel,
      activeAgents: doc.activeAgents,
      totalAgents: doc.totalAgents,
      pricingRuleId: doc.pricingRuleId,
      pricingRuleName: doc.pricingRuleName,
      slaTier: doc.slaTier,
      pickupAvailability: doc.pickupAvailability,
      dropoffEligible: doc.dropoffEligible,
      avgPickupsPerDay: doc.avgPickupsPerDay,
      avgDropoffsPerDay: doc.avgDropoffsPerDay,
      demandIntensity: doc.demandIntensity,
      coverageGapPercent: doc.coverageGapPercent,
      enterpriseClients: doc.enterpriseClients,
      contractOverrides: doc.contractOverrides,
      performance: doc.performance,
      version: doc.version,
      createdBy: doc.createdBy,
      lastChangedBy: doc.lastChangedBy,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
