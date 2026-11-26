/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Middleware ghi nhật ký toàn bộ HTTP Request (Method, URL, Status, Thời gian xử lý, IP)
 */

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const startTime = process.hrtime.bigint();
    const { method, originalUrl } = req;
    const ip = extractClientIp(req);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const status = res.statusCode;
      const line = `${method} ${originalUrl} ${status} - ${durationMs.toFixed(1)}ms [${ip}]`;

      if (status >= 500) {
        this.logger.error(line);
      } else if (status >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
