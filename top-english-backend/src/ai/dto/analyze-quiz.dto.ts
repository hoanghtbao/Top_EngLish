/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO phân tích và giải thích lỗi sai bài tập trắc nghiệm
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeQuizDto {
  @ApiProperty({
    description: 'Nội dung câu hỏi trắc nghiệm',
    example: 'She _____ to London three times this year.',
  })
  @IsString({ message: 'Câu hỏi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  @MaxLength(1000)
  question: string;

  @ApiProperty({
    description: 'Đáp án học viên đã chọn nhưng bị sai',
    example: 'went',
  })
  @IsString({ message: 'Đáp án đã chọn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đáp án đã chọn không được để trống' })
  @MaxLength(500)
  selectedAnswer: string;

  @ApiProperty({
    description: 'Đáp án chính xác của hệ thống',
    example: 'has been',
  })
  @IsString({ message: 'Đáp án đúng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đáp án đúng không được để trống' })
  @MaxLength(500)
  correctAnswer: string;

  @ApiPropertyOptional({
    description: 'Giải thích sơ lược ban đầu của câu hỏi (nếu có)',
    example: 'Diễn tả trải nghiệm lặp lại nhiều lần cho tới hiện tại.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;
}
