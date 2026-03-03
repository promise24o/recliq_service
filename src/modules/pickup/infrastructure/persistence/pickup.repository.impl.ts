import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PickupDocument } from './pickup.model';
import { PickupRequest, PickupRequestSummary, FunnelStage, FailureAnalysis, PickupFilters, PaginatedResult, MatchingEvent } from '../../domain/types/pickup.types';
import { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { GeocodingService } from '../../../../shared/services/geocoding.service';

@Injectable()
export class PickupRepositoryImpl implements IPickupRepository {
  constructor(
    @InjectModel('Pickup')
    private readonly pickupModel: Model<PickupDocument>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async create(pickupData: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PickupRequest> {
    const pickup = new this.pickupModel(pickupData);
    const saved = await pickup.save();
    return await this.toEntity(saved);
  }

  async findById(id: string): Promise<PickupRequest | null> {
    const doc = await this.pickupModel.findById(id);
    return doc ? await this.toEntity(doc) : null;
  }

  async findAll(filters: PickupFilters): Promise<PaginatedResult<PickupRequest>> {
    const query: any = {};
    const page = filters.page || 1;
    const limit = filters.limit || 25;

    if (filters.city) query.city = filters.city;
    if (filters.zone) query.zone = filters.zone;
    if (filters.pickupMode) query.pickupMode = filters.pickupMode;
    if (filters.matchType) query.matchType = filters.matchType;
    if (filters.wasteType) query.wasteType = filters.wasteType;
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      query.$or = [
        { userName: { $regex: filters.search, $options: 'i' } },
        { userPhone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.timeRange) {
      const now = new Date();
      let startDate: Date;
      switch (filters.timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          query.createdAt = {
            $gte: startDate,
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          };
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      if (filters.timeRange !== 'yesterday') {
        query.createdAt = { $gte: startDate };
      }
    }

    const [docs, total] = await Promise.all([
      this.pickupModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.pickupModel.countDocuments(query),
    ]);

    return {
      data: await Promise.all(docs.map(doc => this.toEntity(doc))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userId: string): Promise<PickupRequest[]> {
    const docs = await this.pickupModel
      .find({ userId })
      .populate('assignedAgentId', 'name email profilePhoto phone')
      .sort({ createdAt: -1 });
    return await Promise.all(docs.map(doc => this.toEntity(doc)));
  }

  async findByAgentId(agentId: string): Promise<PickupRequest[]> {
    const docs = await this.pickupModel.find({ assignedAgentId: agentId }).sort({ createdAt: -1 });
    return await Promise.all(docs.map(doc => this.toEntity(doc)));
  }

  async update(id: string, updates: Partial<PickupRequest>): Promise<PickupRequest> {
    const updateData: any = { ...updates };
    
    const doc = await this.pickupModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    if (!doc) {
      throw new Error('Pickup request not found');
    }
    return await this.toEntity(doc);
  }

  async updateStatus(id: string, status: string, additionalData?: Partial<PickupRequest>): Promise<PickupRequest> {
    const updateData: any = { status, ...additionalData };
    
    const doc = await this.pickupModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    if (!doc) {
      throw new Error('Pickup request not found');
    }
    return await this.toEntity(doc);
  }

  async addMatchingEvent(id: string, event: MatchingEvent): Promise<PickupRequest> {
    const doc = await this.pickupModel.findByIdAndUpdate(
      id,
      { $push: { matchingTimeline: event } },
      { new: true },
    );
    if (!doc) {
      throw new Error('Pickup request not found');
    }
    return await this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.pickupModel.findByIdAndDelete(id);
  }

  async getSummary(filters?: { city?: string; timeRange?: string }): Promise<PickupRequestSummary> {
    const baseQuery = this.buildTimeQuery(filters?.timeRange);
    if (filters?.city) baseQuery.city = filters.city;

    const [
      newRequests,
      matchingInProgress,
      assignedPickups,
      dropoffRequests,
      atRiskSLA,
      failedRequests,
      completedToday,
    ] = await Promise.all([
      this.pickupModel.countDocuments({ ...baseQuery, status: 'new' }),
      this.pickupModel.countDocuments({ ...baseQuery, status: 'matching' }),
      this.pickupModel.countDocuments({ ...baseQuery, status: { $in: ['assigned', 'agent_en_route', 'arrived'] } }),
      this.pickupModel.countDocuments({ ...baseQuery, pickupMode: 'dropoff' }),
      this.pickupModel.countDocuments({
        ...baseQuery,
        status: { $in: ['new', 'matching', 'assigned', 'agent_en_route'] },
        slaDeadline: { $lte: new Date(Date.now() + 15 * 60 * 1000) },
      }),
      this.pickupModel.countDocuments({ ...baseQuery, status: 'failed' }),
      this.pickupModel.countDocuments({
        status: 'completed',
        completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    return {
      newRequests,
      matchingInProgress,
      assignedPickups,
      dropoffRequests,
      atRiskSLA,
      failedRequests,
      completedToday,
    };
  }

  async getFunnelData(filters?: { city?: string; timeRange?: string }): Promise<FunnelStage[]> {
    const baseQuery = this.buildTimeQuery(filters?.timeRange);
    if (filters?.city) baseQuery.city = filters.city;

    const stages = [
      { stage: 'Request Created', statuses: ['new', 'matching', 'assigned', 'agent_en_route', 'arrived', 'completed', 'cancelled', 'failed'] },
      { stage: 'Matching Started', statuses: ['matching', 'assigned', 'agent_en_route', 'arrived', 'completed', 'failed'] },
      { stage: 'Agent Notified', statuses: ['assigned', 'agent_en_route', 'arrived', 'completed', 'failed'] },
      { stage: 'Agent Accepted', statuses: ['assigned', 'agent_en_route', 'arrived', 'completed'] },
      { stage: 'Arrival Confirmed', statuses: ['arrived', 'completed'] },
      { stage: 'Pickup Completed', statuses: ['completed'] },
    ];

    const totalCreated = await this.pickupModel.countDocuments(baseQuery);
    if (totalCreated === 0) {
      return stages.map(s => ({
        stage: s.stage,
        count: 0,
        percentage: 0,
        breakdown: { pickup: 0, dropoff: 0, auto: 0, userSelected: 0 },
      }));
    }

    const results: FunnelStage[] = [];

    for (const stageConfig of stages) {
      const stageQuery = { ...baseQuery, status: { $in: stageConfig.statuses } };

      const [count, pickupCount, dropoffCount, autoCount, userSelectedCount] = await Promise.all([
        this.pickupModel.countDocuments(stageQuery),
        this.pickupModel.countDocuments({ ...stageQuery, pickupMode: 'pickup' }),
        this.pickupModel.countDocuments({ ...stageQuery, pickupMode: 'dropoff' }),
        this.pickupModel.countDocuments({ ...stageQuery, matchType: 'auto' }),
        this.pickupModel.countDocuments({ ...stageQuery, matchType: 'user_selected' }),
      ]);

      results.push({
        stage: stageConfig.stage,
        count,
        percentage: Math.round((count / totalCreated) * 100),
        breakdown: {
          pickup: pickupCount,
          dropoff: dropoffCount,
          auto: autoCount,
          userSelected: userSelectedCount,
        },
      });
    }

    return results;
  }

  async getFailureAnalysis(filters?: { city?: string; timeRange?: string }): Promise<FailureAnalysis> {
    const baseQuery = this.buildTimeQuery(filters?.timeRange);
    if (filters?.city) baseQuery.city = filters.city;

    const failedQuery = { ...baseQuery, status: 'failed' };

    const [
      totalFailures,
      noAvailableAgent,
      agentRejection,
      timeout,
      userCancellation,
      supplyShortage,
      distance,
      peakHourCongestion,
      agentFlakiness,
    ] = await Promise.all([
      this.pickupModel.countDocuments(failedQuery),
      this.pickupModel.countDocuments({ ...failedQuery, failureReason: 'no_available_agent' }),
      this.pickupModel.countDocuments({ ...failedQuery, failureReason: 'agent_rejection' }),
      this.pickupModel.countDocuments({ ...failedQuery, failureReason: 'timeout' }),
      this.pickupModel.countDocuments({ ...failedQuery, failureReason: 'user_cancellation' }),
      this.pickupModel.countDocuments({ ...baseQuery, delayReason: 'supply_shortage' }),
      this.pickupModel.countDocuments({ ...baseQuery, delayReason: 'distance' }),
      this.pickupModel.countDocuments({ ...baseQuery, delayReason: 'peak_hour_congestion' }),
      this.pickupModel.countDocuments({ ...baseQuery, delayReason: 'agent_flakiness' }),
    ]);

    const cityAggregation = await this.pickupModel.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$city',
          totalRequests: { $sum: 1 },
          failures: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          delays: {
            $sum: { $cond: [{ $ne: ['$delayReason', null] }, 1, 0] },
          },
        },
      },
    ]);

    const cityBreakdown: Record<string, { failures: number; delays: number; totalRequests: number }> = {};
    for (const city of cityAggregation) {
      cityBreakdown[city._id] = {
        failures: city.failures,
        delays: city.delays,
        totalRequests: city.totalRequests,
      };
    }

    return {
      totalFailures,
      failureReasons: {
        noAvailableAgent,
        agentRejection,
        timeout,
        userCancellation,
      },
      delayCauses: {
        supplyShortage,
        distance,
        peakHourCongestion,
        agentFlakiness,
      },
      cityBreakdown,
    };
  }

  async countByStatus(status: string, filters?: { city?: string; timeRange?: string }): Promise<number> {
    const query: any = { status };
    if (filters?.city) query.city = filters.city;
    if (filters?.timeRange) {
      Object.assign(query, this.buildTimeQuery(filters.timeRange));
    }
    return this.pickupModel.countDocuments(query);
  }

  async findAtRiskSLA(thresholdMinutes: number): Promise<PickupRequest[]> {
    const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000);
    const docs = await this.pickupModel.find({
      status: { $in: ['new', 'matching', 'assigned', 'agent_en_route'] },
      slaDeadline: { $lte: threshold },
    }).sort({ slaDeadline: 1 });
    return await Promise.all(docs.map(doc => this.toEntity(doc)));
  }

  async findActiveByAgentId(agentId: string): Promise<PickupRequest | null> {
    const doc = await this.pickupModel.findOne({
      assignedAgentId: agentId,
      status: { $in: ['pending_acceptance', 'assigned', 'agent_en_route', 'arrived'] },
    });
    return doc ? await this.toEntity(doc) : null;
  }

  private buildTimeQuery(timeRange?: string): any {
    if (!timeRange) return {};
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { createdAt: { $gte: startDate } };
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        return {
          createdAt: {
            $gte: startDate,
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        };
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { createdAt: { $gte: startDate } };
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        return { createdAt: { $gte: startDate } };
      default:
        return {};
    }
  }

  private async toEntity(doc: PickupDocument): Promise<PickupRequest> {
    // Geocode address if it's "Current location"
    let displayAddress = doc.address;
    if (doc.address === 'Current location' || doc.address === 'current location') {
      try {
        displayAddress = await this.geocodingService.reverseGeocode(doc.coordinates);
      } catch (error) {
        // Keep original address if geocoding fails
        console.error('Failed to geocode address for pickup:', error.message);
      }
    }

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      userName: doc.userName,
      userPhone: doc.userPhone,
      city: doc.city,
      zone: doc.zone,
      pickupMode: doc.pickupMode,
      matchType: doc.matchType,
      wasteType: doc.wasteType,
      estimatedWeight: doc.estimatedWeight,
      actualWeight: doc.actualWeight,
      status: doc.status,
      assignedAgentId: doc.assignedAgentId?.toString(),
      assignedAgentName: doc.assignedAgentName,
      assignedAgentDetails: doc.assignedAgentDetails ? {
        id: doc.assignedAgentId?.toString() || '',
        name: doc.assignedAgentDetails.name,
        email: doc.assignedAgentDetails.email,
        photo: doc.assignedAgentDetails.photo,
        phoneNumber: doc.assignedAgentDetails.phoneNumber,
      } : undefined,
      slaDeadline: doc.slaDeadline?.toISOString(),
      pricing: doc.pricing,
      coordinates: doc.coordinates,
      address: displayAddress,
      notes: doc.notes,
      matchingTimeline: doc.matchingTimeline || [],
      failureReason: doc.failureReason,
      delayReason: doc.delayReason,
      completedAt: doc.completedAt?.toISOString(),
      cancelledAt: doc.cancelledAt?.toISOString(),
      cancellationReason: doc.cancellationReason,
      escalatedTo: doc.escalatedTo?.toString(),
      escalatedAt: doc.escalatedAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}
