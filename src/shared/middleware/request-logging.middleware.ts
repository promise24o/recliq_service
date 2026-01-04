import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, body } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Log incoming request with body (handle null/undefined body)
    const requestBody = body && typeof body === 'object' ? JSON.stringify(body) : '{}';
    this.logger.log(`🚀 ${method} ${originalUrl} - IP: ${ip} - Body: ${requestBody} - UA: ${userAgent.substring(0, 50)}`);

    // Capture response body
    let responseBody: any;

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function (data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    // Override res.send to capture response
    const originalSend = res.send;
    res.send = function (data) {
      if (typeof data === 'string') {
        try {
          responseBody = JSON.parse(data);
        } catch {
          responseBody = data;
        }
      } else {
        responseBody = data;
      }
      return originalSend.call(this, data);
    };

    // Log response when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || 0;
      const responseTime = Date.now() - startTime;

      const statusEmoji = statusCode < 300 ? '✅' : statusCode < 400 ? '⚠️' : '❌';
      const responseStr = responseBody ? JSON.stringify(responseBody) : 'null';
      
      this.logger.log(
        `${statusEmoji} ${method} ${originalUrl} - ${statusCode} - ${responseTime}ms - ${contentLength}bytes - Response: ${responseStr} - IP: ${ip}`
      );
    });

    next();
  }
}
