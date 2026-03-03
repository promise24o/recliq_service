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
import { PickupRequest } from '../../domain/types/pickup.types';

export interface PickupRequestPayload {
  pickupId: string;
  userId: string;
  userName: string;
  userPhone: string;
  pickupMode: string;
  wasteType: string;
  estimatedWeight: number;
  address: string;
  coordinates: { lat: number; lng: number };
  pricing: {
    baseAmount: number;
    bonusAmount: number;
    totalAmount: number;
    currency: string;
  };
  notes?: string;
  slaDeadline: string;
}

export interface PickupStatusUpdate {
  pickupId: string;
  status: string;
  agentId?: string;
  agentName?: string;
  message: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/pickup',
})
export class PickupGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PickupGateway.name);
  private readonly socketUserMap = new Map<string, { id: string; role: string }>();

  constructor(private readonly jwtService: JwtService) {}

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
      const userId = payload.sub || payload.id;
      const userRole = payload.role || 'user';

      if (!userId) {
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      (client as any).userId = userId;
      (client as any).userRole = userRole;
      this.socketUserMap.set(client.id, { id: userId, role: userRole });

      // Join user-specific room
      client.join(`user:${userId}`);

      // If agent, also join agent room
      if (userRole === 'agent') {
        client.join(`agent:${userId}`);
        client.join('agents'); // Global agents room for broadcasts
      }

      this.logger.log(`User ${userId} (${userRole}) connected to pickup gateway (socket: ${client.id})`);
      client.emit('connected', { message: 'Connected to pickup events', userId, role: userRole });
    } catch (error) {
      this.logger.warn(`Client ${client.id} rejected: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.socketUserMap.get(client.id);
    if (user) {
      this.socketUserMap.delete(client.id);
      this.logger.log(`User ${user.id} disconnected from pickup gateway (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('subscribe:pickup')
  async handleSubscribeToPickup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pickupId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    client.join(`pickup:${data.pickupId}`);
    this.logger.log(`User ${userId} subscribed to pickup ${data.pickupId}`);
    client.emit('subscribed', { pickupId: data.pickupId });
  }

  @SubscribeMessage('unsubscribe:pickup')
  async handleUnsubscribeFromPickup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pickupId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    client.leave(`pickup:${data.pickupId}`);
    this.logger.log(`User ${userId} unsubscribed from pickup ${data.pickupId}`);
    client.emit('unsubscribed', { pickupId: data.pickupId });
  }

  // Emit new pickup request to specific agent
  emitNewPickupRequestToAgent(agentId: string, pickup: PickupRequestPayload) {
    this.logger.log(`Emitting new pickup request ${pickup.pickupId} to agent ${agentId}`);
    
    try {
      // Check if agent is connected - safer approach
      const agentSockets = this.server.sockets.sockets;
      let isConnected = false;
      
      // Check if any socket belongs to this agent
      for (const [socketId, socket] of agentSockets) {
        if ((socket as any).userId === agentId && (socket as any).userRole === 'agent') {
          isConnected = true;
          break;
        }
      }
      
      if (isConnected) {
        this.server.to(`agent:${agentId}`).emit('pickup:new_request', pickup);
        this.logger.log(`✅ Successfully sent pickup request to connected agent ${agentId}`);
      } else {
        this.logger.warn(`⚠️ Agent ${agentId} is not connected to WebSocket. Pickup request will be delivered via FCM only.`);
        // The FCM notification is already sent in the use case, so we just log here
      }
    } catch (error) {
      this.logger.error(`❌ Error checking agent connection: ${error.message}`);
      // Fallback to just sending the WebSocket event
      this.server.to(`agent:${agentId}`).emit('pickup:new_request', pickup);
      this.logger.log(`📤 Sent pickup request to agent ${agentId} (connection check failed)`);
    }
  }

  // Emit pickup status update to user
  emitPickupStatusToUser(userId: string, update: PickupStatusUpdate) {
    this.logger.log(`Emitting pickup status update to user ${userId}: ${update.status}`);
    this.server.to(`user:${userId}`).emit('pickup:status_update', update);
  }

  // Emit pickup status update to agent
  emitPickupStatusToAgent(agentId: string, update: PickupStatusUpdate) {
    this.logger.log(`Emitting pickup status update to agent ${agentId}: ${update.status}`);
    this.server.to(`agent:${agentId}`).emit('pickup:status_update', update);
  }

  // Emit to all subscribers of a specific pickup
  emitToPickupSubscribers(pickupId: string, event: string, data: any) {
    this.logger.log(`Emitting ${event} to pickup ${pickupId} subscribers`);
    this.server.to(`pickup:${pickupId}`).emit(event, data);
  }

  // Emit agent accepted notification to user
  emitAgentAcceptedToUser(userId: string, data: {
    pickupId: string;
    agentId: string;
    agentName: string;
    estimatedArrivalTime: number;
  }) {
    this.logger.log(`Emitting agent accepted to user ${userId} for pickup ${data.pickupId}`);
    this.server.to(`user:${userId}`).emit('pickup:agent_accepted', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit agent declined notification to user
  emitAgentDeclinedToUser(userId: string, data: {
    pickupId: string;
    agentId: string;
    agentName: string;
    reason?: string;
  }) {
    this.logger.log(`Emitting agent declined to user ${userId} for pickup ${data.pickupId}`);
    this.server.to(`user:${userId}`).emit('pickup:agent_declined', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit cancellation notification
  emitPickupCancelled(userId: string, agentId: string | undefined, data: {
    pickupId: string;
    cancelledBy: 'user' | 'agent' | 'admin' | 'system';
    reason: string;
  }) {
    this.logger.log(`Emitting pickup cancelled for ${data.pickupId}`);
    
    // Notify user
    this.server.to(`user:${userId}`).emit('pickup:cancelled', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Notify agent if assigned
    if (agentId) {
      this.server.to(`agent:${agentId}`).emit('pickup:cancelled', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Emit location tracking enabled notification
  emitTrackingEnabled(userId: string, agentId: string, data: {
    pickupId: string;
    pickupMode: string;
    trackableUserId: string;
  }) {
    const targetRoom = data.pickupMode === 'pickup' ? `user:${userId}` : `agent:${agentId}`;
    this.logger.log(`Emitting tracking enabled for pickup ${data.pickupId} to ${targetRoom}`);
    this.server.to(targetRoom).emit('pickup:tracking_enabled', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle agent reconnection - deliver pending requests
  async handleAgentReconnection(agentId: string, client: Socket) {
    this.logger.log(`🔄 Agent ${agentId} reconnected. Checking for pending requests...`);
    
    try {
      // Import here to avoid circular dependency
      const { GetPickupRequestsUseCase } = require('../application/use-cases/get-pickup-requests.usecase');
      const getPickupRequestsUseCase = new GetPickupRequestsUseCase(
        // This would need to be injected properly in a real implementation
        null as any // Placeholder
      );
      
      // Get pending requests for this agent
      const requests = await getPickupRequestsUseCase.findByAgentId(agentId);
      const pendingRequests = requests.filter(r => r.status === 'pending_acceptance');
      
      if (pendingRequests.length > 0) {
        this.logger.log(`📦 Found ${pendingRequests.length} pending requests for agent ${agentId}`);
        
        // Emit each pending request to the reconnected agent
        pendingRequests.forEach(request => {
          this.emitNewPickupRequestToAgent(agentId, {
            pickupId: request.id,
            userId: request.userId,
            userName: request.userName,
            userPhone: request.userPhone,
            pickupMode: request.pickupMode,
            wasteType: request.wasteType,
            estimatedWeight: request.estimatedWeight,
            address: request.address,
            coordinates: request.coordinates,
            pricing: request.pricing,
            notes: request.notes,
            slaDeadline: request.slaDeadline,
          });
        });
        
        // Notify agent about pending requests
        client.emit('agent:pending_requests', {
          count: pendingRequests.length,
          requests: pendingRequests.map(r => ({
            id: r.id,
            userName: r.userName,
            pickupMode: r.pickupMode,
            wasteType: r.wasteType,
            estimatedWeight: r.estimatedWeight,
            address: r.address,
            pricing: r.pricing,
            createdAt: r.createdAt,
          })),
        });
      } else {
        this.logger.log(`✅ No pending requests for agent ${agentId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to deliver pending requests to agent ${agentId}:`, error.message);
    }
  }
}
