/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO nộp bài tập dành cho học viên
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: 'Em đã hoàn thành ôn tập toàn bộ 30 từ vựng và ghi nhớ các ví dụ.', description: 'Nội dung nộp bài / ghi chú' })
  @IsOptional()
  @IsString({ message: 'Nội dung nộp bài phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Nội dung nộp bài không được vượt quá 2000 ký tự' })
  content?: string;

  @ApiPropertyOptional({ example: '6aee...99a', description: 'ID bài làm trắc nghiệm QuizSubmission' })
  @IsOptional()
  @IsString({ message: 'ID kết quả quiz phải là chuỗi' })
  quizResultId?: string;

  @ApiPropertyOptional({ example: 90, description: 'Điểm số tự động (tính từ kết quả quiz)' })
  @IsOptional()
  @IsNumber({}, { message: 'Điểm số phải là số' })
  @Min(0, { message: 'Điểm số không được âm' })
  score?: number;
}
