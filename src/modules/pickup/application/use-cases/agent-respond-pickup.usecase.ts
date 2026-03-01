import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';
import { AgentResponseType } from '../../presentation/dto/agent-respond-pickup.dto';
import { PickupGateway } from '../../presentation/gateways/pickup.gateway';
import { NotificationService } from '../../../../shared/services/notification.service';

export interface AgentRespondResult {
  pickup: PickupRequest;
  trackingEnabled: boolean;
  trackableUserId?: string;
}

@Injectable()
export class AgentRespondToPickupUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
    private readonly pickupGateway: PickupGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(
    pickupId: string,
    agentId: string,
    agentName: string,
    response: AgentResponseType,
    reason?: string,
    estimatedArrivalMinutes?: number,
  ): Promise<AgentRespondResult> {
    const pickup = await this.pickupRepository.findById(pickupId);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${pickupId} not found`);
    }

    // Verify the agent is the one assigned to this pickup
    if (pickup.assignedAgentId !== agentId) {
      throw new ForbiddenException('You are not assigned to this pickup request');
    }

    // Verify the pickup is in pending_acceptance status
    if (pickup.status !== 'pending_acceptance') {
      throw new BadRequestException(
        `Cannot respond to pickup with status '${pickup.status}'. Must be 'pending_acceptance'.`,
      );
    }

    if (response === AgentResponseType.ACCEPT) {
      return this.handleAccept(pickup, agentId, agentName, estimatedArrivalMinutes);
    } else {
      return this.handleDecline(pickup, agentId, agentName, reason!);
    }
  }

  private async handleAccept(
    pickup: PickupRequest,
    agentId: string,
    agentName: string,
    estimatedArrivalMinutes?: number,
  ): Promise<AgentRespondResult> {
    const eta = estimatedArrivalMinutes || 15;

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'agent_accepted',
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      details: `Agent ${agentName} accepted the request. ETA: ${eta} minutes`,
    };

    await this.pickupRepository.addMatchingEvent(pickup.id, event);
    const updatedPickup = await this.pickupRepository.updateStatus(pickup.id, 'assigned', {});

    // Emit WebSocket event to user
    this.pickupGateway.emitAgentAcceptedToUser(pickup.userId, {
      pickupId: pickup.id,
      agentId,
      agentName,
      estimatedArrivalTime: eta,
    });

    // Send FCM notification to user
    try {
      await this.notificationService.sendAgentAssignedNotification(
        pickup.userId,
        pickup.id,
        agentName,
        eta,
      );
    } catch (error) {
      console.error('Failed to send agent accepted FCM notification:', error.message);
    }

    // Determine tracking based on pickup mode
    // For pickup: user tracks agent location
    // For dropoff: agent tracks user location
    const trackingEnabled = true;
    const trackableUserId = pickup.pickupMode === 'pickup' ? agentId : pickup.userId;

    // Emit tracking enabled event
    this.pickupGateway.emitTrackingEnabled(pickup.userId, agentId, {
      pickupId: pickup.id,
      pickupMode: pickup.pickupMode,
      trackableUserId,
    });

    return {
      pickup: updatedPickup,
      trackingEnabled,
      trackableUserId,
    };
  }

  private async handleDecline(
    pickup: PickupRequest,
    agentId: string,
    agentName: string,
    reason: string,
  ): Promise<AgentRespondResult> {
    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'agent_declined',
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      details: `Agent ${agentName} declined the request. Reason: ${reason}`,
    };

    await this.pickupRepository.addMatchingEvent(pickup.id, event);
    
    // Move back to matching status to find another agent
    const updatedPickup = await this.pickupRepository.updateStatus(pickup.id, 'matching', {
      assignedAgentId: undefined,
      assignedAgentName: undefined,
    });

    // Emit WebSocket event to user
    this.pickupGateway.emitAgentDeclinedToUser(pickup.userId, {
      pickupId: pickup.id,
      agentId,
      agentName,
      reason,
    });

    // Send FCM notification to user about decline
    try {
      await this.notificationService.sendToUser(
        { userId: pickup.userId },
        {
          title: 'Agent Unavailable',
          body: `${agentName} is unable to handle your request. We're finding another agent for you.`,
          data: {
            type: 'agent_declined',
            pickupId: pickup.id,
            agentName,
          },
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          sound: 'default',
        },
      );
    } catch (error) {
      console.error('Failed to send agent declined FCM notification:', error.message);
    }

    return {
      pickup: updatedPickup,
      trackingEnabled: false,
    };
  }
}
