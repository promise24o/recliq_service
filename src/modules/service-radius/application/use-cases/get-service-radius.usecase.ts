import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IServiceRadiusRepository } from '../../domain/repositories/service-radius.repository';
import type { ServiceRadiusResponseDto } from '../../../auth/presentation/dto/service-radius.dto';
import type { IZoneRepository } from '../../../zones/domain/repositories/zone.repository';

@Injectable()
export class GetServiceRadiusUseCase {
  constructor(
    @Inject('IServiceRadiusRepository')
    private readonly serviceRadiusRepository: IServiceRadiusRepository,
    @Inject('IZoneRepository')
    private readonly zoneRepository: IZoneRepository,
  ) {}

  async execute(userId: string): Promise<ServiceRadiusResponseDto> {
    let serviceRadius = await this.serviceRadiusRepository.findByUserId(userId);

    // If no service radius exists, create default one
    if (!serviceRadius) {
      serviceRadius = await this.serviceRadiusRepository.create(userId, {
        radius: 5,
        autoExpandRadius: false,
        restrictDuringPeakHours: false,
        serviceZones: [],
      });
    }

    // Calculate estimates based on radius
    const estimates = this.calculateEstimates(serviceRadius.radius);

    // Fetch zone details if service zones exist
    let zoneDetails: any[] = [];
    if (serviceRadius.serviceZones && serviceRadius.serviceZones.length > 0) {
      // Get all active zones and filter by the service zone IDs
      const allZones = await this.zoneRepository.findAll({ status: 'active' });
      zoneDetails = allZones
        .filter(zone => serviceRadius.serviceZones.includes(zone.id))
        .map(zone => ({
          _id: zone.id,
          name: zone.name,
          city: zone.city,
          state: zone.state,
          description: zone.description,
          boundary: zone.boundary,
          center: zone.boundary?.center,
          areaKm2: zone.boundary?.areaKm2
        }));
    }

    return {
      radius: serviceRadius.radius,
      autoExpandRadius: serviceRadius.autoExpandRadius,
      restrictDuringPeakHours: serviceRadius.restrictDuringPeakHours,
      serviceZones: zoneDetails,
      currentLocation: serviceRadius.currentLocation?.coordinates ? {
        latitude: serviceRadius.currentLocation.coordinates[1],
        longitude: serviceRadius.currentLocation.coordinates[0],
      } : undefined,
      estimatedDailyRequests: estimates.dailyRequests,
      averagePayoutPerJob: estimates.payoutPerJob,
      estimatedFuelCost: estimates.fuelCost,
      averageResponseTime: estimates.responseTime,
      updatedAt: serviceRadius.updatedAt.toISOString(),
    };
  }

  private calculateEstimates(radius: number) {
    // Simple estimation formulas (can be enhanced with real data)
    const baseRequests = 10;
    const requestsPerKm = 2;
    const dailyRequests = Math.round(baseRequests + (radius * requestsPerKm));

    const basePayout = 2000;
    const payoutVariance = radius * 50;
    const payoutPerJob = basePayout + payoutVariance;

    const baseFuelCost = 800;
    const fuelCostPerKm = 100;
    const fuelCost = Math.round(baseFuelCost + (radius * fuelCostPerKm));

    const baseResponseTime = 5;
    const timePerKm = 0.5;
    const responseTime = Math.round(baseResponseTime + (radius * timePerKm));

    return {
      dailyRequests,
      payoutPerJob,
      fuelCost,
      responseTime,
    };
  }
}
