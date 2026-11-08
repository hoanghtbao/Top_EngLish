/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cấu hình ảnh nền và hiệu ứng Hero trang chủ
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateHomepageHeroDto {
  @ApiProperty({
    description: 'Đường dẫn URL ảnh nền Hero trang chủ',
    example: 'http://localhost:5001/uploads/hero-bg-default.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  backgroundUrl?: string;

  @ApiProperty({
    description: 'Độ mờ của lớp phủ overlay (từ 0.1 đến 0.95)',
    example: 0.85,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  overlayOpacity?: number;

  @ApiProperty({
    description: 'Độ mờ viền ảnh / Blur (px, từ 0 đến 20)',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  blurAmount?: number;

  @ApiProperty({
    description: 'Trạng thái kích hoạt hiển thị ảnh nền',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({
    description: 'Tên thương hiệu hiển thị ở Logo',
    example: 'TopEnglish',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    description: 'Phụ đề thương hiệu hiển thị dưới Logo',
    example: 'by HoangBao',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandSubtitle?: string;

  @ApiProperty({
    description: 'Tiêu đề chính của Hero Banner trang chủ',
    example: 'Chinh phục tiếng Anh với',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiProperty({
    description: 'Từ khóa nổi bật với dải gradient màu',
    example: 'TopEnglish',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroHighlight?: string;

  @ApiProperty({
    description: 'Đoạn mô tả ngắn gọn bên dưới tiêu đề trang chủ',
    example: 'Ghi nhớ từ vựng qua thẻ Flashcard 3D...',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiProperty({
    description: 'Huy hiệu / Badge nổi bật trên đầu Hero Banner',
    example: 'Nền tảng học tiếng Anh thông minh thế hệ mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  heroBadge?: string;
}
