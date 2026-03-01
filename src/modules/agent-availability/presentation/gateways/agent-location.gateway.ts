import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { LocationTrackingService } from '../../../../shared/services/location-tracking.service';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';

interface LocationPayload {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/agent-location',
})
export class AgentLocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgentLocationGateway.name);
  // Map socket.id -> agentId for cleanup on disconnect
  private readonly socketAgentMap = new Map<string, string>();

  constructor(
    private readonly locationTrackingService: LocationTrackingService,
    private readonly jwtService: JwtService,
    @Inject('IAgentAvailabilityRepository')
    private readonly agentAvailabilityRepository: IAgentAvailabilityRepository,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const agentId = payload.sub || payload.id;

      if (!agentId) {
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      // Store agentId on the socket for later use
      (client as any).agentId = agentId;
      this.socketAgentMap.set(client.id, agentId);

      // Join agent-specific room
      client.join(`agent:${agentId}`);

      this.logger.log(`Agent ${agentId} connected via WebSocket (socket: ${client.id})`);
      client.emit('connected', { message: 'Connected to location tracking', agentId });
    } catch (error) {
      this.logger.warn(`Client ${client.id} rejected: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const agentId = this.socketAgentMap.get(client.id);
    if (agentId) {
      this.socketAgentMap.delete(client.id);
      this.logger.log(`Agent ${agentId} disconnected (socket: ${client.id})`);
      // Don't remove from Redis immediately — let TTL handle stale cleanup
      // This handles brief disconnections without losing the agent's last known location
    }
  }

  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationPayload,
  ) {
    const agentId = (client as any).agentId;
    if (!agentId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.logger.log(`[WS] Location update from agent ${agentId}: ${JSON.stringify(data)}`);

    if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
      this.logger.warn(`[WS] Invalid location data from agent ${agentId}: ${JSON.stringify(data)}`);
      client.emit('location:error', { message: 'Invalid location data. Provide lat and lng.' });
      return;
    }

    // Validate timestamp if provided (reject future or very old timestamps)
    if (data.timestamp) {
      const now = Date.now();
      const diff = Math.abs(now - data.timestamp);
      if (diff > 60000) {
        // > 1 minute drift
        this.logger.warn(`[WS] Timestamp too far from server time for agent ${agentId}: ${diff}ms`);
        client.emit('location:error', { message: 'Timestamp too far from server time' });
        return;
      }
    }

    const success = await this.locationTrackingService.updateAgentLocation(
      agentId,
      data.lat,
      data.lng,
      data.accuracy,
    );

    if (success) {
      this.logger.log(`[WS] Location updated successfully for agent ${agentId}`);
      client.emit('location:ack', {
        status: 'ok',
        timestamp: Date.now(),
      });
    } else {
      this.logger.error(`[WS] Failed to update location for agent ${agentId}`);
      client.emit('location:error', { message: 'Failed to update location' });
    }
  }

  @SubscribeMessage('agent:online')
  async handleAgentOnline(@ConnectedSocket() client: Socket) {
    const agentId = (client as any).agentId;
    if (!agentId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    await this.agentAvailabilityRepository.updateOnlineStatus(agentId, true);
    this.logger.log(`Agent ${agentId} went online via WebSocket`);
    client.emit('status:updated', { isOnline: true });
  }

  @SubscribeMessage('agent:offline')
  async handleAgentOffline(@ConnectedSocket() client: Socket) {
    const agentId = (client as any).agentId;
    if (!agentId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    await this.agentAvailabilityRepository.updateOnlineStatus(agentId, false);
    await this.locationTrackingService.removeAgentLocation(agentId);
    this.logger.log(`Agent ${agentId} went offline via WebSocket`);
    client.emit('status:updated', { isOnline: false });
  }
}
