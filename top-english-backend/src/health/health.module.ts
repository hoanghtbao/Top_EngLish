/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý kiểm tra sức khỏe hệ thống
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
