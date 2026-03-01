import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import type { IAuthRepository } from '../../../auth/domain/repositories/auth.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';
import { PickupGateway } from '../../presentation/gateways/pickup.gateway';
import { NotificationService } from '../../../../shared/services/notification.service';

export interface CancelPickupResult {
  pickup: PickupRequest;
  cancellationStats: {
    totalCancellations: number;
    cancellationsThisMonth: number;
  };
}

@Injectable()
export class CancelPickupRequestUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
    @Inject('IAuthRepository')
    private readonly userRepository: IAuthRepository,
    private readonly pickupGateway: PickupGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(
    id: string, 
    reason: string | undefined, 
    cancelledByUserId: string,
    cancelledByName: string,
    cancellerRole: 'user' | 'agent' | 'admin',
  ): Promise<CancelPickupResult> {
    const pickup = await this.pickupRepository.findById(id);
    if (!pickup) {
      throw new NotFoundException(`Pickup request with ID ${id} not found`);
    }

    if (['completed', 'cancelled'].includes(pickup.status)) {
      throw new BadRequestException(
        `Cannot cancel pickup with status '${pickup.status}'.`,
      );
    }

    // Check if user is authorized to cancel
    if (cancellerRole === 'user' && pickup.userId !== cancelledByUserId) {
      throw new ForbiddenException('You can only cancel your own pickup requests');
    }

    // Determine if reason is required
    const agentHasAccepted = ['assigned', 'agent_en_route', 'arrived'].includes(pickup.status);
    
    if (agentHasAccepted && !reason) {
      throw new BadRequestException(
        'A cancellation reason is required when an agent has already accepted the pickup',
      );
    }

    const cancellationReason = reason || 'No reason provided';

    const event: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'user_cancelled',
      timestamp: new Date().toISOString(),
      details: `Request cancelled by ${cancelledByName} (${cancellerRole}): ${cancellationReason}`,
    };

    await this.pickupRepository.addMatchingEvent(id, event);

    const cancelledPickup = await this.pickupRepository.updateStatus(id, 'cancelled', {
      cancelledAt: new Date().toISOString(),
      cancellationReason,
    });

    // Update cancellation stats for the user
    const cancellationStats = await this.updateCancellationStats(pickup.userId, cancellationReason);

    // Emit WebSocket events
    this.pickupGateway.emitPickupCancelled(
      pickup.userId,
      pickup.assignedAgentId,
      {
        pickupId: pickup.id,
        cancelledBy: cancellerRole,
        reason: cancellationReason,
      },
    );

    // Send FCM notifications
    try {
      if (cancellerRole === 'user' && pickup.assignedAgentId) {
        // Notify agent that user cancelled
        await this.notificationService.sendPickupCancelledToAgent(
          pickup.assignedAgentId,
          pickup.id,
          pickup.userName,
          cancellationReason,
        );
      } else if (cancellerRole === 'agent' || cancellerRole === 'admin') {
        // Notify user that pickup was cancelled
        await this.notificationService.sendPickupCancelledNotification(
          pickup.userId,
          pickup.id,
          cancelledByName,
          cancellationReason,
        );
      }
    } catch (error) {
      console.error('Failed to send cancellation FCM notification:', error.message);
    }

    return {
      pickup: cancelledPickup,
      cancellationStats,
    };
  }

  private async updateCancellationStats(
    userId: string,
    reason: string,
  ): Promise<{ totalCancellations: number; cancellationsThisMonth: number }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { totalCancellations: 0, cancellationsThisMonth: 0 };
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let stats = user.cancellationStats || {
        totalCancellations: 0,
        cancellationsThisMonth: 0,
        cancellationReasons: [],
      };

      // Reset monthly count if it's a new month
      if (stats.lastCancellationAt) {
        const lastCancellation = new Date(stats.lastCancellationAt);
        if (lastCancellation.getMonth() !== currentMonth || 
            lastCancellation.getFullYear() !== currentYear) {
          stats.cancellationsThisMonth = 0;
        }
      }

      stats.totalCancellations += 1;
      stats.cancellationsThisMonth += 1;
      stats.lastCancellationAt = now;
      
      // Keep last 10 reasons
      stats.cancellationReasons = [reason, ...(stats.cancellationReasons || [])].slice(0, 10);

      await this.userRepository.updatePartial(userId, { cancellationStats: stats } as any);

      return {
        totalCancellations: stats.totalCancellations,
        cancellationsThisMonth: stats.cancellationsThisMonth,
      };
    } catch (error) {
      console.error('Failed to update cancellation stats:', error.message);
      return { totalCancellations: 0, cancellationsThisMonth: 0 };
    }
  }
}
