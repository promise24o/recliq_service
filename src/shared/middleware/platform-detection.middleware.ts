import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface PlatformInfo {
  platform: 'web' | 'mobile' | 'unknown';
  userAgent: string;
  isMobile: boolean;
  isWeb: boolean;
}

declare global {
  namespace Express {
    interface Request {
      platform?: PlatformInfo;
    }
  }
}

@Injectable()
export class PlatformDetectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';
    
    // Detect platform based on User-Agent
    const isMobile = this.isMobileUserAgent(userAgent);
    const isWeb = this.isWebUserAgent(userAgent);
    
    let platform: 'web' | 'mobile' | 'unknown';
    
    if (isWeb && !isMobile) {
      platform = 'web';
    } else if (isMobile) {
      platform = 'mobile';
    } else {
      platform = 'unknown';
    }

    req.platform = {
      platform,
      userAgent,
      isMobile,
      isWeb,
    };

    console.log(`Platform Detection - Platform: ${platform}, User-Agent: ${userAgent}`);
    
    next();
  }

  private isMobileUserAgent(userAgent: string): boolean {
    // Only Flutter/Dart apps should be considered "mobile" for our purposes
    // Web browsers (even mobile browsers) should be "web"
    const flutterPatterns = [
      /Dart\//i,  // Flutter apps
    ];
    
    return flutterPatterns.some(pattern => pattern.test(userAgent));
  }

  private isWebUserAgent(userAgent: string): boolean {
    // All browsers (including mobile browsers) should be "web"
    const webPatterns = [
      /Mozilla\/5\.0.*\(.*Macintosh.*\)/i,
      /Mozilla\/5\.0.*\(.*Windows.*\)/i,
      /Mozilla\/5\.0.*\(.*X11.*\)/i,
      /Chrome\//i,
      /Firefox\//i,
      /Safari\//i,
      /Edge\//i,
      /AppleWebKit\//i, // Mobile browsers
    ];
    
    return webPatterns.some(pattern => pattern.test(userAgent));
  }
}
