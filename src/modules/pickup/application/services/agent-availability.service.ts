import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IAgentAvailabilityRepository } from '../../../agent-availability/domain/repositories/agent-availability.repository';
import type { IServiceRadiusRepository } from '../../../service-radius/domain/repositories/service-radius.repository';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { LocationTrackingService } from '../../../../shared/services/location-tracking.service';
import { Coordinates } from '../../domain/types/pickup.types';
import { DistanceCalculator } from '../utils/distance-calculator.util';

export interface AvailableAgent {
  agentId: string;
  agentName: string;
  currentLocation: Coordinates;
  distance: number;
  estimatedArrivalTime: number;
  rating?: number;
  vehicleType?: string;
  locationSource: 'live' | 'stored';
}

@Injectable()
export class AgentAvailabilityService {
  private readonly logger = new Logger(AgentAvailabilityService.name);

  constructor(
    @Inject('IAgentAvailabilityRepository')
    private readonly agentAvailabilityRepository: IAgentAvailabilityRepository,
    @Inject('IServiceRadiusRepository')
    private readonly serviceRadiusRepository: IServiceRadiusRepository,
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
    @Inject('IAuthRepository')
    private readonly userRepository: IAuthRepository,
    private readonly locationTrackingService: LocationTrackingService,
  ) {}

  async findAvailableAgents(
    userLocation: Coordinates,
    zoneId: string,
  ): Promise<AvailableAgent[]> {
    this.logger.log(`[AgentMatch] Finding agents for user location: ${JSON.stringify(userLocation)}, zoneId: ${zoneId}`);
    
    // Step 1: Get agents who have this zone in their serviceZones
    const agentsInZone = await this.serviceRadiusRepository.findAgentsByZoneId(zoneId);

    if (!agentsInZone || agentsInZone.length === 0) {
      return [];
    }

    const availableAgents: AvailableAgent[] = [];

    for (const serviceRadius of agentsInZone) {
      const agentUserId = serviceRadius.userId.toString();

      // Step 2: Check if agent is online via agent-availability
      const availability = await this.agentAvailabilityRepository.findByUserId(agentUserId);
      if (!availability || !availability.isOnline) {
        continue;
      }

      // Step 3: Check if agent has an active pickup
      const activePickup = await this.pickupRepository.findActiveByAgentId(agentUserId);
      if (activePickup) {
        continue;
      }

      // Step 4: Get LIVE location from Redis first, fallback to stored
      let agentLocation: Coordinates | null = null;
      let locationSource: 'live' | 'stored' = 'live';

      const liveLocation = await this.locationTrackingService.getAgentLocation(agentUserId);
      if (liveLocation) {
        agentLocation = { lat: liveLocation.latitude, lng: liveLocation.longitude };
        locationSource = 'live';
      } else if (serviceRadius.currentLocation?.coordinates?.length) {
        // Fallback to stored location in service_radius
        const [lng, lat] = serviceRadius.currentLocation.coordinates;
        agentLocation = { lat, lng };
        locationSource = 'stored';
        this.logger.debug(`Using stored location for agent ${agentUserId} (no live data)`);
      }

      if (!agentLocation) {
        continue;
      }

      // Step 5: Calculate distance and ETA
      const distance = DistanceCalculator.calculateDistance(userLocation, agentLocation);
      const estimatedArrivalTime = DistanceCalculator.estimateArrivalTime(distance);

      // Step 6: Get agent name from user profile
      const user = await this.userRepository.findById(agentUserId);
      const agentName = user?.name || 'Unknown Agent';

      this.logger.log(`[AgentMatch] Agent ${agentUserId}: ${agentName}, location: ${JSON.stringify(agentLocation)}, distance: ${distance}km, source: ${locationSource}`);
      
      availableAgents.push({
        agentId: agentUserId,
        agentName,
        currentLocation: agentLocation,
        distance: Math.round(distance * 100) / 100,
        estimatedArrivalTime,
        locationSource,
      });
    }

    // Sort by distance (closest first)
    availableAgents.sort((a, b) => a.distance - b.distance);

    return availableAgents;
  }

  async findClosestAgent(
    userLocation: Coordinates,
    zoneId: string,
  ): Promise<AvailableAgent | null> {
    const availableAgents = await this.findAvailableAgents(userLocation, zoneId);

    if (availableAgents.length === 0) {
      return null;
    }

    return availableAgents[0];
  }
}
