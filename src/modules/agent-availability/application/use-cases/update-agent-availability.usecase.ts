import { Injectable, Inject } from '@nestjs/common';
import type { IAgentAvailabilityRepository } from '../../domain/repositories/agent-availability.repository';
import type { UpdateAvailabilityDto, AgentAvailabilityResponseDto } from '../../presentation/dto/agent-availability.dto';

@Injectable()
export class UpdateAgentAvailabilityUseCase {
  constructor(
    @Inject('IAgentAvailabilityRepository')
    private readonly availabilityRepository: IAgentAvailabilityRepository,
  ) {}

  async execute(userId: string, dto: UpdateAvailabilityDto): Promise<AgentAvailabilityResponseDto> {
    const updateData: any = {};

    if (dto.isOnline !== undefined) {
      updateData.isOnline = dto.isOnline;
    }

    if (dto.weeklySchedule) {
      updateData.weeklySchedule = dto.weeklySchedule;
      updateData['insights.totalHoursPerWeek'] = this.calculateTotalHours(dto.weeklySchedule);
      updateData['insights.lastUpdated'] = new Date();
    }

    if (dto.availableForEnterpriseJobs !== undefined) {
      updateData.availableForEnterpriseJobs = dto.availableForEnterpriseJobs;
    }

    if (dto.autoGoOnlineDuringSchedule !== undefined) {
      updateData.autoGoOnlineDuringSchedule = dto.autoGoOnlineDuringSchedule;
    }

    const availability = await this.availabilityRepository.update(userId, updateData);

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

  private calculateTotalHours(weeklySchedule: any): number {
    let totalHours = 0;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
      const daySchedule = weeklySchedule[day];
      if (daySchedule?.enabled && daySchedule.timeSlots) {
        for (const slot of daySchedule.timeSlots) {
          const start = this.parseTime(slot.startTime);
          const end = this.parseTime(slot.endTime);
          totalHours += (end - start) / 60;
        }
      }
    }

    return Math.round(totalHours * 10) / 10;
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
