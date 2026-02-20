import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.token';
import { UserSummary } from '../../domain/types/user.types';

@Injectable()
export class GetUserSummaryUseCase {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserSummary> {
    return this.userRepository.getUserSummary();
  }
}
