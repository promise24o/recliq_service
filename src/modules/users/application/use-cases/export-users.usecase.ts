import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.token';
import { UserFilter, User } from '../../domain/types/user.types';
import { ExportUsersDto, ExportFormat } from '../../presentation/dto/export-users.dto';

@Injectable()
export class ExportUsersUseCase {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository) {}

  async execute(exportDto: ExportUsersDto): Promise<{ data: User[]; filename: string; contentType: string }> {
    // Convert export DTO to filter
    const filter: UserFilter = {
      city: exportDto.city,
      zone: exportDto.zone,
      status: exportDto.status,
      type: exportDto.type,
      // Handle date range conversion
      dateFrom: this.convertDateRange(exportDto.dateRange)?.from,
      dateTo: this.convertDateRange(exportDto.dateRange)?.to,
      // For export, get all records without pagination
      page: 1,
      limit: 10000,
    };

    const users = await this.userRepository.exportUsers(filter);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `users_export_${timestamp}.${exportDto.format}`;
    const contentType = exportDto.format === ExportFormat.CSV ? 'text/csv' : 'application/pdf';

    return {
      data: users,
      filename,
      contentType,
    };
  }

  private convertDateRange(dateRange?: string): { from: Date; to: Date } | null {
    if (!dateRange) return null;

    const now = new Date();
    const from = new Date();

    switch (dateRange) {
      case '30days':
        from.setDate(now.getDate() - 30);
        break;
      case '90days':
        from.setDate(now.getDate() - 90);
        break;
      case '180days':
        from.setDate(now.getDate() - 180);
        break;
      case 'all':
        return null; // No date filter
      default:
        return null;
    }

    return { from, to: now };
  }
}
