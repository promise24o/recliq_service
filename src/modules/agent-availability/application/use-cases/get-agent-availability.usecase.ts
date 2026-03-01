import { Injectable, Inject } from '@nestjs/common';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';
import type { AgentAvailabilityResponseDto } from '../../presentation/dto/agent-availability.dto';

@Injectable()
export class GetAgentAvailabilityUseCase {
  constructor(
    @Inject('IAgentAvailabilityRepository')
    private readonly availabilityRepository: IAgentAvailabilityRepository,
  ) {}

  async execute(userId: string): Promise<AgentAvailabilityResponseDto> {
    let availability = await this.availabilityRepository.findByUserId(userId);

    if (!availability) {
      availability = await this.availabilityRepository.create(userId, {
        isOnline: false,
        weeklySchedule: {
          monday: { enabled: false, timeSlots: [] },
          tuesday: { enabled: false, timeSlots: [] },
          wednesday: { enabled: false, timeSlots: [] },
          thursday: { enabled: false, timeSlots: [] },
          friday: { enabled: false, timeSlots: [] },
          saturday: { enabled: false, timeSlots: [] },
          sunday: { enabled: false, timeSlots: [] }
        },
        availableForEnterpriseJobs: false,
        autoGoOnlineDuringSchedule: false,
        insights: {
          avgWeeklyEarnings: 0,
          peakHoursStart: '18:00',
          peakHoursEnd: '20:00',
          totalHoursPerWeek: 0,
          lastUpdated: new Date()
        }
      });
    }

    return {
      isOnline: availability.isOnline,
      weeklySchedule: availability.weeklySchedule,
      availableForEnterpriseJobs: availability.availableForEnterpriseJobs,
      autoGoOnlineDuringSchedule: availability.autoGoOnlineDuringSchedule,
      insights: {
        avgWeeklyEarnings: availability.insights.avgWeeklyEarnings,
        peakHoursStart: availability.insights.peakHoursStart,
        peakHoursEnd: availability.insights.peakHoursEnd,
        totalHoursPerWeek: availability.insights.totalHoursPerWeek,
        lastUpdated: availability.insights.lastUpdated.toISOString()
      },
      updatedAt: availability.updatedAt.toISOString()
    };
  }
}
