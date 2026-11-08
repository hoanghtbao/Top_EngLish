/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO giao bài tập mới trong lớp học
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AssignmentType } from '../schemas/assignment.schema';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Bài tập 01: Ôn tập 30 từ vựng Chủ đề Công nghệ', description: 'Tiêu đề bài tập' })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  @MaxLength(150, { message: 'Tiêu đề không được vượt quá 150 ký tự' })
  title: string;

  @ApiPropertyOptional({ example: 'Học viên xem flashcard và hoàn thành trước 23h59 ngày Chủ nhật.', description: 'Hướng dẫn làm bài' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Mô tả không được vượt quá 1000 ký tự' })
  description?: string;

  @ApiProperty({ enum: AssignmentType, example: AssignmentType.QUIZ, description: 'Phân loại bài tập (quiz, vocabulary, grammar, custom)' })
  @IsEnum(AssignmentType, { message: 'Loại bài tập không hợp lệ (quiz, vocabulary, grammar, custom)' })
  type: AssignmentType;

  @ApiPropertyOptional({ example: '6aee...f12', description: 'ID tài liệu liên kết (Quiz ID, Topic ID, GrammarLesson ID)' })
  @IsOptional()
  @IsString({ message: 'ID tài liệu phải là chuỗi' })
  targetId?: string;

  @ApiPropertyOptional({ example: 'Bộ từ vựng Công nghệ Thông tin', description: 'Tên hiển thị của tài liệu' })
  @IsOptional()
  @IsString({ message: 'Tên tài liệu phải là chuỗi' })
  targetTitle?: string;

  @ApiProperty({ example: '2026-11-20T23:59:59.000Z', description: 'Hạn chót nộp bài (ISO 8601 string)' })
  @IsDateString({}, { message: 'Hạn chót nộp bài phải đúng định dạng ngày tháng ISO 8601' })
  dueDate: string;

  @ApiPropertyOptional({ example: 100, description: 'Điểm số tối đa cho bài tập này' })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm tối đa phải là số' })
  @Min(1, { message: 'Điểm tối đa tối thiểu là 1' })
  @Max(1000, { message: 'Điểm tối đa không vượt quá 1000' })
  maxScore?: number;
}
