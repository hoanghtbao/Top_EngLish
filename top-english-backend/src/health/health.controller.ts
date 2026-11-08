/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller kiểm tra trạng thái hoạt động (Health check) của Server và Database
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly mongoConnection: Connection) {}

  /**
   * Kiểm tra tình trạng kết nối máy chủ và cơ sở dữ liệu MongoDB
   * @returns Thông tin trạng thái uptime, môi trường và kết nối DB
   */
  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái server và kết nối MongoDB' })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  checkHealth() {
    // 1: connected, 2: connecting, 0: disconnected, 3: disconnecting
    const isDbConnected = this.mongoConnection.readyState === 1;

    return {
      status: 'ok',
      service: 'top-english-backend',
      environment: process.env.NODE_ENV || 'development',
      database: isDbConnected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
