/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Middleware giới hạn tần suất yêu cầu (Rate Limiting) bảo vệ Auth, AI và API chung khỏi spam
 */

import { HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { extractClientIp } from './logger.middleware';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitPolicy {
  name: 'auth' | 'ai' | 'default';
  limit: number;
  windowMs: number;
}

const WINDOW_MS = 60_000;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly store = new Map<string, RateLimitBucket>();

  constructor() {
    // Dọn các bản ghi hết hạn mỗi phút để tránh rò rỉ bộ nhớ
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetAt <= now) {
          this.store.delete(key);
        }
      }
    }, WINDOW_MS);
    timer.unref();
  }

  private resolvePolicy(url: string): RateLimitPolicy {
    const cleanUrl = url.split('?')[0].toLowerCase();

    if (
      cleanUrl.startsWith('/api/v1/auth/login') ||
      cleanUrl.startsWith('/api/v1/auth/register') ||
      cleanUrl.startsWith('/api/v1/auth/google')
    ) {
      return { name: 'auth', limit: 20, windowMs: WINDOW_MS };
    }

    if (cleanUrl.startsWith('/api/v1/ai')) {
      return { name: 'ai', limit: 30, windowMs: WINDOW_MS };
    }

    return { name: 'default', limit: 120, windowMs: WINDOW_MS };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const url = req.originalUrl || req.url || '';
    if (req.method === 'OPTIONS' || url.startsWith('/uploads/')) {
      next();
      return;
    }

    const ip = extractClientIp(req);
    const policy = this.resolvePolicy(url);
    const key = `${policy.name}:${ip}`;
    const now = Date.now();

    let bucket = this.store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + policy.windowMs };
    }

    bucket.count += 1;
    this.store.set(key, bucket);

    const remaining = Math.max(0, policy.limit - bucket.count);
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('X-RateLimit-Limit', String(policy.limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > policy.limit) {
      res.setHeader('Retry-After', String(resetSeconds));
      this.logger.warn(
        `Rate limit exceeded [${policy.name}] IP=${ip} URL=${req.method} ${url}`,
      );

      const errorResponse: ApiResponse<null> = {
        success: false,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Bạn thao tác quá nhanh, vui lòng thử lại sau ${resetSeconds} giây.`,
        data: null,
        timestamp: new Date().toISOString(),
      };
      res.status(HttpStatus.TOO_MANY_REQUESTS).json(errorResponse);
      return;
    }

    next();
  }
}
