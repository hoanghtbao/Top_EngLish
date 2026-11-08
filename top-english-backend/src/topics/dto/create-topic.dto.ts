/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tạo mới chủ đề từ vựng
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnglishLevel } from '../enums/english-level.enum';

export class CreateTopicDto {
  @ApiProperty({ example: 'Technology & AI', description: 'Tên chủ đề từ vựng' })
  @IsString({ message: 'Tiêu đề chủ đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề chủ đề không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: 'technology-and-ai', description: 'Đường dẫn slug duy nhất' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Các thuật ngữ và từ vựng cốt lõi về công nghệ và trí tuệ nhân tạo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1518770660439-4636190af475' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ enum: EnglishLevel, example: EnglishLevel.B1, description: 'Trình độ CEFR' })
  @IsEnum(EnglishLevel, { message: 'Trình độ phải là một trong các mức: A1, A2, B1, B2, C1, C2' })
  @IsNotEmpty({ message: 'Trình độ không được để trống' })
  level: EnglishLevel;
}
