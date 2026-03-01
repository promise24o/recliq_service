import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export interface AgentLocationData {
  agentId: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

@Injectable()
export class LocationTrackingService {
  private readonly logger = new Logger(LocationTrackingService.name);
  private readonly GEO_KEY = 'agents:live';
  private readonly LAST_SEEN_PREFIX = 'agent:lastSeen:';
  private readonly ACCURACY_PREFIX = 'agent:accuracy:';
  private readonly LAST_SEEN_TTL = 300; // 5 minutes

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async updateAgentLocation(
    agentId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
  ): Promise<boolean> {
    try {
      this.logger.log(`[Redis] Updating location for agent ${agentId}: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}`);

      // Validate coordinates
      if (!this.isValidCoordinate(latitude, longitude)) {
        this.logger.warn(`[Redis] Invalid coordinates for agent ${agentId}: ${latitude}, ${longitude}`);
        return false;
      }

      // Reject poor GPS accuracy (> 200m)
      if (accuracy && accuracy > 200) {
        this.logger.warn(`[Redis] Poor GPS accuracy for agent ${agentId}: ${accuracy}m`);
        return false;
      }

      // GEOADD agents:live <lng> <lat> <agentId>
      await this.redis.geoadd(this.GEO_KEY, longitude, latitude, agentId);
      this.logger.log(`[Redis] GEOADD successful for agent ${agentId}`);

      // Update last seen timestamp with TTL
      await this.redis.set(
        `${this.LAST_SEEN_PREFIX}${agentId}`,
        Date.now().toString(),
        'EX',
        this.LAST_SEEN_TTL,
      );
      this.logger.log(`[Redis] Set lastSeen for agent ${agentId}`);

      // Store accuracy if provided
      if (accuracy) {
        await this.redis.set(
          `${this.ACCURACY_PREFIX}${agentId}`,
          accuracy.toString(),
          'EX',
          this.LAST_SEEN_TTL,
        );
        this.logger.log(`[Redis] Set accuracy for agent ${agentId}: ${accuracy}m`);
      }

      return true;
    } catch (error) {
      this.logger.error(`[Redis] Failed to update location for agent ${agentId}:`, error.message);
      return false;
    }
  }

  async getNearbyAgents(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<AgentLocationData[]> {
    try {
      // GEORADIUS agents:live <lng> <lat> <radius> km WITHDIST ASC
      const results = await this.redis.georadius(
        this.GEO_KEY,
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC',
      );

      const agents: AgentLocationData[] = [];

      for (const result of results) {
        const agentId = result[0] as string;
        const distance = parseFloat(result[1] as string);

        // Check if agent has recent location update (not stale)
        const lastSeen = await this.redis.get(`${this.LAST_SEEN_PREFIX}${agentId}`);
        if (!lastSeen) {
          continue; // Skip stale agents
        }

        // Get agent's actual coordinates
        const pos = await this.redis.geopos(this.GEO_KEY, agentId);
        if (!pos || !pos[0]) continue;

        agents.push({
          agentId,
          longitude: parseFloat(pos[0][0] as string),
          latitude: parseFloat(pos[0][1] as string),
          distance: Math.round(distance * 100) / 100,
        });
      }

      return agents;
    } catch (error) {
      this.logger.error('Failed to get nearby agents:', error.message);
      return [];
    }
  }

  async getAgentLocation(agentId: string): Promise<AgentLocationData | null> {
    try {
      this.logger.log(`[Redis] Getting location for agent ${agentId}`);
      
      const pos = await this.redis.geopos(this.GEO_KEY, agentId);
      this.logger.log(`[Redis] GEOPOS result for agent ${agentId}: ${JSON.stringify(pos)}`);
      
      if (!pos || !pos[0]) {
        this.logger.warn(`[Redis] No position found for agent ${agentId}`);
        return null;
      }

      const lastSeen = await this.redis.get(`${this.LAST_SEEN_PREFIX}${agentId}`);
      this.logger.log(`[Redis] Last seen for agent ${agentId}: ${lastSeen}`);
      
      if (!lastSeen) {
        this.logger.warn(`[Redis] Agent ${agentId} has no lastSeen timestamp (stale)`);
        return null;
      }

      const location = {
        agentId,
        longitude: parseFloat(pos[0][0] as string),
        latitude: parseFloat(pos[0][1] as string),
      };
      
      this.logger.log(`[Redis] Found live location for agent ${agentId}: ${JSON.stringify(location)}`);
      return location;
    } catch (error) {
      this.logger.error(`[Redis] Failed to get location for agent ${agentId}:`, error.message);
      return null;
    }
  }

  async removeAgentLocation(agentId: string): Promise<void> {
    try {
      await this.redis.zrem(this.GEO_KEY, agentId);
      await this.redis.del(`${this.LAST_SEEN_PREFIX}${agentId}`);
      await this.redis.del(`${this.ACCURACY_PREFIX}${agentId}`);
      this.logger.log(`Removed location for agent ${agentId}`);
    } catch (error) {
      this.logger.error(`Failed to remove location for agent ${agentId}:`, error.message);
    }
  }

  async getOnlineAgentCount(): Promise<number> {
    try {
      return await this.redis.zcard(this.GEO_KEY);
    } catch (error) {
      this.logger.error('Failed to get online agent count:', error.message);
      return 0;
    }
  }

  async removeStaleAgents(): Promise<number> {
    try {
      // Get all agents in the geo set
      const allAgents = await this.redis.zrange(this.GEO_KEY, 0, -1);
      let removedCount = 0;

      for (const agentId of allAgents) {
        const lastSeen = await this.redis.get(`${this.LAST_SEEN_PREFIX}${agentId}`);
        if (!lastSeen) {
          // No lastSeen means TTL expired — agent is stale
          await this.redis.zrem(this.GEO_KEY, agentId);
          await this.redis.del(`${this.ACCURACY_PREFIX}${agentId}`);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.logger.log(`Removed ${removedCount} stale agents from live tracking`);
      }

      return removedCount;
    } catch (error) {
      this.logger.error('Failed to remove stale agents:', error.message);
      return 0;
    }
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }
}
