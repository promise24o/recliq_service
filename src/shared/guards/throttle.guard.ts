import { Injectable, ExecutionContext, HttpStatus, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerException, ThrottlerStorage, InjectThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { AUTH_THROTTLE_KEY } from '../decorators/auth-throttle.decorator';

@Injectable()
export class AuthThrottleGuard {
  protected errorMessage = 'Too many authentication attempts. Please try again later.';
  protected statusCode = HttpStatus.TOO_MANY_REQUESTS;

  constructor(
    @Inject('THROTTLER_OPTIONS') private options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() private storageService: ThrottlerStorage,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const customThrottle = this.reflector.get(AUTH_THROTTLE_KEY, context.getHandler());
    
    const limit = customThrottle?.limit || 5;
    const ttl = customThrottle?.ttl || 60;
    
    return this.handleRequest(context, limit, ttl);
  }

  async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIdentifier = this.getClientIdentifier(request);
    
    try {
      const key = this.generateKey(context, clientIdentifier);
      const { totalHits, timeToExpire } = await this.storageService.increment(key, ttl, limit, 0, 'auth');
      
      if (totalHits > limit) {
        throw new ThrottlerException(this.errorMessage);
      }
      
      const response = context.switchToHttp().getResponse();
      response.header('X-RateLimit-Limit', limit);
      response.header('X-RateLimit-Remaining', Math.max(0, limit - totalHits));
      response.header('X-RateLimit-Reset', timeToExpire);
      
      return true;
    } catch (err) {
      if (err instanceof ThrottlerException) {
        throw err;
      }
      throw new ThrottlerException(this.errorMessage);
    }
  }

  private getClientIdentifier(request: any): string {
    return request.ip || 
           request.connection?.remoteAddress || 
           request.headers['x-forwarded-for'] || 
           'unknown';
  }

  private generateKey(context: ExecutionContext, identifier: string): string {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.path;
    return `auth:${route}:${identifier}`;
  }
}