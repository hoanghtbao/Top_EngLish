/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật thông tin hồ sơ cá nhân
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn B', description: 'Họ và tên mới' })
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString({ message: 'Avatar phải là đường link chuỗi' })
  avatar?: string;
}
