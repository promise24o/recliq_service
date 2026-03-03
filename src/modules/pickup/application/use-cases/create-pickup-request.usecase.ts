import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IPickupRepository } from '../../domain/repositories/pickup.repository';
import { PickupRequest, MatchingEvent } from '../../domain/types/pickup.types';
import { SLA_DEADLINE_MINUTES, DEFAULT_CURRENCY } from '../../domain/constants/pickup.constants';
import { CreatePickupRequestDto } from '../../presentation/dto/create-pickup-request.dto';
import { AgentMatchingService } from '../services/agent-matching.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PickupGateway } from '../../presentation/gateways/pickup.gateway';
import { GeocodingService } from '../../../../shared/services/geocoding.service';

@Injectable()
export class CreatePickupRequestUseCase {
  constructor(
    @Inject('IPickupRepository')
    private readonly pickupRepository: IPickupRepository,
    private readonly agentMatchingService: AgentMatchingService,
    private readonly notificationService: NotificationService,
    private readonly pickupGateway: PickupGateway,
    private readonly geocodingService: GeocodingService,
  ) {}

  async execute(dto: CreatePickupRequestDto, userId: string, userName: string, userPhone: string): Promise<PickupRequest> {
    let matchingResult;
    
    if (dto.matchType === 'auto') {
      matchingResult = await this.agentMatchingService.matchAgentAuto(dto.coordinates);
    } else {
      if (!dto.assignedAgentId) {
        throw new BadRequestException('Agent ID is required for manual selection');
      }
      matchingResult = await this.agentMatchingService.validateManualAgentSelection(
        dto.coordinates,
        dto.assignedAgentId,
      );
    }

    if (!matchingResult.serviceable) {
      throw new BadRequestException(matchingResult.message || 'Unable to process pickup request');
    }
    const slaMinutes = SLA_DEADLINE_MINUTES[dto.pickupMode] || 60;
    const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();

    const initialEvent: MatchingEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      type: 'matching_started',
      timestamp: new Date().toISOString(),
      details: dto.matchType === 'auto'
        ? 'Auto-matching initiated'
        : 'User selected agent for request',
    };

    const baseAmount = this.calculateBaseAmount(dto.wasteType, dto.estimatedWeight);
    const bonusAmount = this.calculateBonusAmount(dto.wasteType, dto.estimatedWeight);

    const assignedAgent = matchingResult.assignedAgent;
    const matchingTimeline: MatchingEvent[] = [initialEvent];

    if (assignedAgent) {
      matchingTimeline.push({
        id: `EVT-${(Date.now() + 1).toString(36).toUpperCase()}`,
        type: 'agent_notified',
        timestamp: new Date().toISOString(),
        agentId: assignedAgent.agentId,
        agentName: assignedAgent.agentName,
        details: dto.matchType === 'auto'
          ? `Auto-matched to ${assignedAgent.agentName} (${assignedAgent.distance.toFixed(2)}km away, ETA: ${assignedAgent.estimatedArrivalTime} mins). Awaiting agent acceptance.`
          : `User selected ${assignedAgent.agentName} (${assignedAgent.distance.toFixed(2)}km away, ETA: ${assignedAgent.estimatedArrivalTime} mins). Awaiting agent acceptance.`,
      });
    }

    const pickupData: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      userName,
      userPhone,
      city: matchingResult.city!,
      zone: matchingResult.zone!,
      pickupMode: dto.pickupMode,
      matchType: dto.matchType,
      wasteType: dto.wasteType,
      estimatedWeight: dto.estimatedWeight,
      status: assignedAgent ? 'pending_acceptance' : 'matching',
      slaDeadline,
      pricing: {
        baseAmount,
        bonusAmount,
        totalAmount: baseAmount + bonusAmount,
        currency: DEFAULT_CURRENCY,
      },
      coordinates: dto.coordinates,
      address: dto.address,
      notes: dto.notes,
      matchingTimeline,
      assignedAgentId: assignedAgent?.agentId,
      assignedAgentName: assignedAgent?.agentName,
    };

    // Create the pickup first
    const pickup = await this.pickupRepository.create(pickupData);

    // Send notification to user
    try {
      await this.notificationService.sendPickupRequestNotification(
        userId,
        pickup.id,
        assignedAgent?.agentName,
      );
    } catch (error) {
      console.error('Failed to send pickup notification to user:', error.message);
    }

    // If agent is assigned, send WebSocket event and FCM notification to agent
    if (assignedAgent) {
      // Emit WebSocket event to agent
      this.pickupGateway.emitNewPickupRequestToAgent(assignedAgent.agentId, {
        pickupId: pickup.id,
        userId,
        userName,
        userPhone,
        pickupMode: dto.pickupMode,
        wasteType: dto.wasteType,
        estimatedWeight: dto.estimatedWeight,
        address: dto.address,
        coordinates: dto.coordinates,
        pricing: pickup.pricing,
        notes: dto.notes,
        slaDeadline,
      });

      // Send FCM notification to agent
      try {
        let displayAddress = dto.address;
        
        // If address is generic, get human-readable address from coordinates
        if (dto.address === 'Current location' || dto.address === 'current location') {
          console.log('Attempting to geocode coordinates:', dto.coordinates);
          try {
            displayAddress = await this.geocodingService.reverseGeocode(dto.coordinates);
            console.log('Geocoded address:', displayAddress);
          } catch (error) {
            console.error('Failed to get address from coordinates:', error.message);
            displayAddress = `Location (${dto.coordinates.lat.toFixed(6)}, ${dto.coordinates.lng.toFixed(6)})`;
          }
        }
        
        await this.notificationService.sendNewPickupRequestToAgent(
          assignedAgent.agentId,
          pickup.id,
          userName,
          dto.wasteType,
          dto.estimatedWeight,
          displayAddress,
          pickup.pricing.totalAmount,
        );
      } catch (error) {
        console.error('Failed to send pickup notification to agent:', error.message);
      }
    }

    return pickup;
  }

  private calculateBaseAmount(wasteType: string, weight: number): number {
    const ratePerKg: Record<string, number> = {
      plastic: 10,
      paper: 8,
      metal: 15,
      glass: 7,
      organic: 5,
      e_waste: 25,
      mixed: 9,
    };
    const rate = ratePerKg[wasteType] || 10;
    return Math.round(rate * weight);
  }

  private calculateBonusAmount(wasteType: string, weight: number): number {
    if (weight >= 10) return Math.round(weight * 2);
    if (weight >= 5) return Math.round(weight * 1);
    return 0;
  }
}
