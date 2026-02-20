import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.token';
import { User, UserAction, UserStatus } from '../../domain/types/user.types';
import { UserActionDto } from '../../presentation/dto/user-action.dto';

@Injectable()
export class UserActionUseCase {
  constructor(@Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository) {}

  async execute(userId: string, actionDto: UserActionDto): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    switch (actionDto.action) {
      case UserAction.SUSPEND:
        return this.suspendUser(userId, actionDto.reason, actionDto.notes);
      
      case UserAction.REACTIVATE:
        return this.reactivateUser(userId, actionDto.reason, actionDto.notes);
      
      case UserAction.FLAG:
        return this.flagUser(userId, actionDto.reason, actionDto.notes);
      
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  private async suspendUser(userId: string, reason?: string, notes?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('User is already suspended');
    }

    return this.userRepository.suspendUser(userId, reason, notes);
  }

  private async reactivateUser(userId: string, reason?: string, notes?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    return this.userRepository.reactivateUser(userId, reason, notes);
  }

  private async flagUser(userId: string, reason?: string, notes?: string): Promise<User> {
    return this.userRepository.flagUser(userId, reason, notes);
  }
}
