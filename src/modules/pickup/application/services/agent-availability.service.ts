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

  /**
   * Check if agent is available at the current day and time based on their weekly schedule
   */
  private isAgentCurrentlyAvailable(weeklySchedule: any): boolean {
    const now = new Date();
    
    // Get current day in full lowercase format to match database keys
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()]; // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // 'HH:MM' format

    this.logger.log(`[Schedule] Current day: ${currentDay}, time: ${currentTime}`);

    // Get today's schedule
    const todaySchedule = weeklySchedule[currentDay];
    this.logger.log(`[Schedule] Today's schedule: ${JSON.stringify(todaySchedule)}`);
    
    if (!todaySchedule || !todaySchedule.enabled) {
      this.logger.log(`[Schedule] Day ${currentDay} is not enabled`);
      return false;
    }

    // If no time slots are defined, agent is available all day
    if (!todaySchedule.timeSlots || todaySchedule.timeSlots.length === 0) {
      this.logger.log(`[Schedule] No time slots defined, available all day`);
      return true;
    }

    // Check if current time falls within any of the time slots
    const isAvailable = todaySchedule.timeSlots.some((slot: any) => {
      const inTimeRange = currentTime >= slot.startTime && currentTime <= slot.endTime;
      this.logger.log(`[Schedule] Checking slot ${slot.startTime}-${slot.endTime}: current ${currentTime} in range: ${inTimeRange}`);
      return inTimeRange;
    });

    this.logger.log(`[Schedule] Agent ${isAvailable ? 'IS' : 'IS NOT'} available at current time`);
    return isAvailable;
  }

  async findAvailableAgents(
    userLocation: Coordinates,
    zoneId: string,
  ): Promise<AvailableAgent[]> {
    this.logger.log(`[AgentMatch] Finding agents for user location: ${JSON.stringify(userLocation)}, zoneId: ${zoneId}`);
    
    // Step 1: Get agents who have this zone in their serviceZones
    const agentsInZone = await this.serviceRadiusRepository.findAgentsByZoneId(zoneId);
    this.logger.log(`[AgentMatch] Found ${agentsInZone?.length || 0} agents in zone ${zoneId}`);

    if (!agentsInZone || agentsInZone.length === 0) {
      this.logger.log(`[AgentMatch] No agents found in zone ${zoneId}`);
      return [];
    }

    const availableAgents: AvailableAgent[] = [];
    let skippedCount = 0;

    for (const serviceRadius of agentsInZone) {
      const agentUserId = serviceRadius.userId.toString();
      this.logger.log(`[AgentMatch] Checking agent ${agentUserId}`);

      // Step 2: Check if agent is online via agent-availability
      const availability = await this.agentAvailabilityRepository.findByUserId(agentUserId);
      if (!availability) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: No availability record found`);
        skippedCount++;
        continue;
      }
      
      if (!availability.isOnline) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: isOnline = ${availability.isOnline}`);
        skippedCount++;
        continue;
      }

      // Step 2.5: Check if agent is available based on their weekly schedule
      this.logger.log(`[AgentMatch] Agent ${agentUserId} weekly schedule: ${JSON.stringify(availability.weeklySchedule)}`);
      if (!this.isAgentCurrentlyAvailable(availability.weeklySchedule)) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: Not available at current day/time`);
        skippedCount++;
        continue;
      }

      // Step 3: Check if agent has an active pickup
      const activePickup = await this.pickupRepository.findActiveByAgentId(agentUserId);
      if (activePickup) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: Has active pickup ${activePickup.id}`);
        skippedCount++;
        continue;
      }

      // Step 4: Get LIVE location from Redis first, fallback to stored
      let agentLocation: Coordinates | null = null;
      let locationSource: 'live' | 'stored' = 'live';

      const liveLocation = await this.locationTrackingService.getAgentLocation(agentUserId);
      if (liveLocation) {
        agentLocation = { lat: liveLocation.latitude, lng: liveLocation.longitude };
        locationSource = 'live';
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: Using live location from Redis`);
      } else if (serviceRadius.currentLocation?.coordinates?.length) {
        // Fallback to stored location in service_radius
        const [lng, lat] = serviceRadius.currentLocation.coordinates;
        agentLocation = { lat, lng };
        locationSource = 'stored';
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: Using stored location (no live data)`);
      }

      if (!agentLocation) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: No location available`);
        skippedCount++;
        continue;
      }

      // Step 5: Calculate distance and ETA
      const distance = DistanceCalculator.calculateDistance(userLocation, agentLocation);
      const estimatedArrivalTime = DistanceCalculator.estimateArrivalTime(distance);

      // Skip agents with stored locations that are too far (>50km)
      if (locationSource === 'stored' && distance > 50) {
        this.logger.log(`[AgentMatch] Agent ${agentUserId}: Too far (${distance}km) with stored location, skipping`);
        skippedCount++;
        continue;
      }

      // Step 6: Get agent name from user profile
      const user = await this.userRepository.findById(agentUserId);
      const agentName = user?.name || 'Unknown Agent';

      this.logger.log(`[AgentMatch] ✓ Agent ${agentUserId}: ${agentName}, location: ${JSON.stringify(agentLocation)}, distance: ${distance}km, source: ${locationSource}`);
      
      availableAgents.push({
        agentId: agentUserId,
        agentName,
        currentLocation: agentLocation,
        distance: Math.round(distance * 100) / 100,
        estimatedArrivalTime,
        locationSource,
      });
    }

    this.logger.log(`[AgentMatch] Summary: ${availableAgents.length} available, ${skippedCount} skipped out of ${agentsInZone.length} total agents in zone`);

    // Sort by location source (live first) then by distance (closest first)
    availableAgents.sort((a, b) => {
      // Live locations come first
      if (a.locationSource === 'live' && b.locationSource !== 'live') {
        return -1;
      }
      if (a.locationSource !== 'live' && b.locationSource === 'live') {
        return 1;
      }
      // Then by distance
      return a.distance - b.distance;
    });

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

  async getDebugInfo(
    userLocation: Coordinates,
    zoneId: string,
  ): Promise<{
    agentsInZone: { userId: string; hasAvailability: boolean; isOnline: boolean; hasActivePickup: boolean; liveLocation: any; storedLocation: any; distance: number | null }[];
  }> {
    const agentsInZone = await this.serviceRadiusRepository.findAgentsByZoneId(zoneId);
    const debugInfo: { userId: string; hasAvailability: boolean; isOnline: boolean; hasActivePickup: boolean; liveLocation: any; storedLocation: any; distance: number | null }[] = [];

    if (!agentsInZone || agentsInZone.length === 0) {
      return { agentsInZone: [] };
    }

    for (const serviceRadius of agentsInZone) {
      const agentUserId = serviceRadius.userId.toString();
      
      // Check availability
      const availability = await this.agentAvailabilityRepository.findByUserId(agentUserId);
      const hasAvailability = !!availability;
      const isOnline = availability?.isOnline || false;

      // Check active pickup
      const activePickup = await this.pickupRepository.findActiveByAgentId(agentUserId);
      const hasActivePickup = !!activePickup;

      // Get live location
      const liveLocation = await this.locationTrackingService.getAgentLocation(agentUserId);

      // Get stored location
      const storedLocation = serviceRadius.currentLocation?.coordinates 
        ? { lng: serviceRadius.currentLocation.coordinates[0], lat: serviceRadius.currentLocation.coordinates[1] }
        : null;

      // Calculate distance
      let distance: number | null = null;
      if (liveLocation) {
        distance = DistanceCalculator.calculateDistance(userLocation, { lat: liveLocation.latitude, lng: liveLocation.longitude });
      } else if (storedLocation) {
        distance = DistanceCalculator.calculateDistance(userLocation, storedLocation);
      }

      debugInfo.push({
        userId: agentUserId,
        hasAvailability,
        isOnline,
        hasActivePickup,
        liveLocation,
        storedLocation,
        distance: distance ? Math.round(distance * 100) / 100 : null,
      });
    }

    return { agentsInZone: debugInfo };
  }
}
