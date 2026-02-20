import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.token';
import { UserFilter, UserPaginationResult } from '../../domain/types/user.types';
import { UserFilterDto } from '../../presentation/dto/user-filter.dto';

@Injectable()
export class GetUsersUseCase {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository) {}

  async execute(filterDto: UserFilterDto): Promise<UserPaginationResult> {
    // Convert DTO to domain filter
    const filter: UserFilter = {
      search: filterDto.search,
      city: filterDto.city,
      zone: filterDto.zone,
      status: filterDto.status,
      type: filterDto.type,
      dateFrom: filterDto.dateFrom ? new Date(filterDto.dateFrom) : undefined,
      dateTo: filterDto.dateTo ? new Date(filterDto.dateTo) : undefined,
      page: filterDto.page || 1,
      limit: filterDto.limit || 25,
    };

    return this.userRepository.findAll(filter);
  }

  async executeSearch(query: string, filterDto?: Partial<UserFilterDto>): Promise<UserPaginationResult> {
    const filter: Partial<UserFilter> = filterDto ? {
      city: filterDto.city,
      zone: filterDto.zone,
      status: filterDto.status,
      type: filterDto.type,
      dateFrom: filterDto.dateFrom ? new Date(filterDto.dateFrom) : undefined,
      dateTo: filterDto.dateTo ? new Date(filterDto.dateTo) : undefined,
      page: filterDto.page || 1,
      limit: filterDto.limit || 25,
    } : {};

    return this.userRepository.searchUsers(query, filter);
  }
}
