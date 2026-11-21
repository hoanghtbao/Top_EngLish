/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tạo mới bài học từ vựng (thuộc một Lớp học)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { EnglishLevel } from '../enums/english-level.enum';

export class CreateTopicDto {
  @ApiProperty({ example: 'Lesson 8: A. Reading - Articles & Reports', description: 'Tên bài học từ vựng' })
  @IsString({ message: 'Tiêu đề bài học phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: '6aede4deab12ea647b67d909', description: 'ID lớp học chứa bài học này' })
  @IsOptional()
  @IsMongoId({ message: 'vocabClassId phải là ObjectId hợp lệ' })
  vocabClassId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Số thứ tự bài học (Bài 1, Bài 2...)' })
  @IsOptional()
  @IsInt({ message: 'Số thứ tự bài học phải là số nguyên' })
  @Min(1)
  lessonNumber?: number;

  @ApiPropertyOptional({ example: 'Articles & Reports', description: 'Nhãn chủ đề ngắn của bài học' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 'lesson-8-articles-reports', description: 'Đường dẫn slug duy nhất' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Target skills: Reading Part 7: Articles & Reports | Writing: Review for Questions 6&7' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1518770660439-4636190af475' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: EnglishLevel, example: EnglishLevel.B1, description: 'Trình độ tham chiếu (A1 - C2)' })
  @IsOptional()
  @IsEnum(EnglishLevel, { message: 'Trình độ phải là một trong các mức: A1, A2, B1, B2, C1, C2' })
  level?: EnglishLevel;
}
