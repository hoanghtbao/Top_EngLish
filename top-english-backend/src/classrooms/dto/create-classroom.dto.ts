/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO định nghĩa dữ liệu đầu vào khi giáo viên tạo lớp học mới
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsNumber, Min, Max } from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ example: 'Lớp Luyện Thi IELTS 6.5+ K12', description: 'Tên lớp học' })
  @IsString({ message: 'Tên lớp học phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên lớp học không được để trống' })
  @MinLength(3, { message: 'Tên lớp học phải có ít nhất 3 ký tự' })
  @MaxLength(100, { message: 'Tên lớp học không được vượt quá 100 ký tự' })
  name: string;

  @ApiPropertyOptional({ example: 'Khóa học tập trung nâng cao ngữ pháp B2 và 500 từ vựng Academic', description: 'Mô tả lớp học' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  @ApiPropertyOptional({ example: 'B2 - Upper Intermediate', description: 'Cấp độ trình độ của lớp' })
  @IsOptional()
  @IsString({ message: 'Cấp độ phải là chuỗi ký tự' })
  gradeLevel?: string;

  @ApiPropertyOptional({ example: 'emerald', description: 'Mã màu chủ đề của thẻ lớp học (emerald, teal, blue, indigo, purple, amber)' })
  @IsOptional()
  @IsString({ message: 'Mã màu phải là chuỗi ký tự' })
  themeColor?: string;

  @ApiPropertyOptional({ example: 50, description: 'Giới hạn sĩ số học viên (0 = không giới hạn)' })
  @IsOptional()
  @IsNumber({}, { message: 'Sĩ số tối đa phải là số' })
  @Min(0, { message: 'Sĩ số không được là số âm' })
  @Max(500, { message: 'Sĩ số không được vượt quá 500' })
  maxStudents?: number;
}
