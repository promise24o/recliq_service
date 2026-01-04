import { SetMetadata } from '@nestjs/common';

export const AUTH_THROTTLE_KEY = 'auth_throttle';

// Different throttle limits for different auth operations
export const AuthThrottle = (limit: number, ttl: number) => 
  SetMetadata(AUTH_THROTTLE_KEY, { limit, ttl });

// Predefined throttle configurations
export const RegisterThrottle = () => AuthThrottle(5, 60); // 5 requests per minute
export const LoginThrottle = () => AuthThrottle(10, 60); // 10 requests per minute
export const OtpThrottle = () => AuthThrottle(3, 60); // 3 OTP attempts per minute
export const RefreshThrottle = () => AuthThrottle(20, 60); // 20 refresh requests per minute
