/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller công khai (Public) cung cấp cấu hình giao diện trang chủ cho người dùng và khách vãng lai
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Public Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Lấy cấu hình ảnh nền và hiệu ứng Hero trang chủ (Công khai)
   */
  @Get('homepage')
  @ApiOperation({
    summary: 'Lấy cấu hình ảnh nền và hiệu ứng Hero trang chủ (Công khai)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy cấu hình ảnh nền thành công',
  })
  async getHomepageSettings() {
    const settings = await this.adminService.getHomepageSettings();
    return {
      message: 'Lấy cấu hình trang chủ thành công',
      data: settings,
    };
  }
}
