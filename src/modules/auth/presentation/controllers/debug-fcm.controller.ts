import { Controller, Get, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../../domain/repositories/auth.repository';

@Controller('debug-fcm')
export class DebugFcmController {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
  ) {}

  @Get('users-with-tokens')
  async getUsersWithFcmTokens() {
    try {
      const users = await this.authRepository.findAll();
      const usersWithTokens = users.filter(user => user.fcmTokens && Object.keys(user.fcmTokens).length > 0);
      
      return {
        totalUsers: users.length,
        usersWithTokens: usersWithTokens.length,
        users: usersWithTokens.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email?.getValue(),
          phone: user.phone?.getValue(),
          fcmTokens: user.fcmTokens,
        }))
      };
    } catch (error) {
      return {
        error: error.message,
        users: []
      };
    }
  }

  @Get('all-users')
  async getAllUsers() {
    try {
      const users = await this.authRepository.findAll();
      
      return {
        totalUsers: users.length,
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email?.getValue(),
          phone: user.phone?.getValue(),
          hasFcmTokens: !!(user.fcmTokens && Object.keys(user.fcmTokens).length > 0),
          fcmTokenCount: user.fcmTokens ? Object.keys(user.fcmTokens).length : 0,
          fcmTokens: user.fcmTokens,
        }))
      };
    } catch (error) {
      return {
        error: error.message,
        users: []
      };
    }
  }

  @Get('android-tokens')
  async getAndroidTokens() {
    try {
      const users = await this.authRepository.findAll();
      const androidUsers = users.filter(user => 
        user.fcmTokens && user.fcmTokens.android
      );
      
      return {
        totalAndroidUsers: androidUsers.length,
        androidUsers: androidUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email?.getValue(),
          androidToken: user.fcmTokens?.android || '',
          tokenLength: user.fcmTokens?.android?.length || 0,
        }))
      };
    } catch (error) {
      return {
        error: error.message,
        androidUsers: []
      };
    }
  }
}
