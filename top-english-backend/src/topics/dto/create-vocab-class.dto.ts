/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tạo mới Lớp học từ vựng (Flashcard) dành cho Giáo viên và Admin
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVocabClassDto {
  @ApiProperty({ example: 'TOEIC 2', description: 'Tên lớp học từ vựng' })
  @IsString({ message: 'Tên lớp học phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên lớp học không được để trống' })
  @MaxLength(100, { message: 'Tên lớp học không quá 100 ký tự' })
  name: string;

  @ApiProperty({ example: 'TE2', description: 'Mã lớp học duy nhất (tự động viết hoa)' })
  @IsString({ message: 'Mã lớp học phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã lớp học không được để trống' })
  @MaxLength(20, { message: 'Mã lớp học không quá 20 ký tự' })
  code: string;

  @ApiPropertyOptional({ example: 'Học toeic 4 kĩ năng', description: 'Mô tả ngắn về lớp học' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
