import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { IBadgeRepository } from '../../domain/repositories/reward.repository';
import { Badge } from '../../domain/entities/badge.entity';

@Injectable()
export class BadgeSeedService implements OnModuleInit {
  private readonly logger = new Logger(BadgeSeedService.name);

  constructor(
    @Inject('IBadgeRepository')
    private readonly badgeRepository: IBadgeRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedBadges();
  }

  private async seedBadges(): Promise<void> {
    try {
      // Check if badges already exist
      const existingBadges = await this.badgeRepository.findActive();
      
      if (existingBadges.length > 0) {
        this.logger.log(`Found ${existingBadges.length} existing badges. Skipping seeding.`);
        return;
      }

      // Define the 5 initial badges
      const badges = [
        new Badge(
          'FIRST_RECYCLE',
          'First Recycle',
          'Completed your first recycling pickup',
          { type: 'FIRST_RECYCLE', value: 1 },
          '♻️'
        ),
        new Badge(
          'WEIGHT_50KG',
          '50kg Recycled',
          'Recycled a total of 50kg of waste',
          { type: 'WEIGHT_THRESHOLD', value: 50 },
          '♻️'
        ),
        new Badge(
          'CARBON_SAVER',
          'Carbon Saver',
          'Saved 100kg of CO2 through recycling',
          { type: 'WEIGHT_THRESHOLD', value: 100 }, // CO2 derived weight
          '🌍'
        ),
        new Badge(
          'COMMUNITY_CONTRIBUTOR',
          'Community Contributor',
          'Completed 20 recycling pickups',
          { type: 'PICKUP_COUNT', value: 20 },
          '🤝'
        ),
        new Badge(
          'CONSISTENCY_CHAMPION',
          'Consistency Champion',
          'Maintained a 4-week recycling streak',
          { type: 'STREAK_WEEKS', value: 4 },
          '🔥'
        ),
      ];

      // Create badges in database
      for (const badge of badges) {
        await this.badgeRepository.create(badge);
      }

      this.logger.log(`Successfully seeded ${badges.length} badges into the database.`);
    } catch (error) {
      this.logger.error('Failed to seed badges:', error);
      throw error;
    }
  }
}
