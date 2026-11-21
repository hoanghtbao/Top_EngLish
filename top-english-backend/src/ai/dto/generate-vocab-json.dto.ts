/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO yêu cầu AI tạo danh sách từ vựng chuẩn JSON cho giáo viên / admin
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateVocabJsonDto {
  @ApiProperty({
    enum: ['topic', 'provided'],
    example: 'provided',
    description:
      '"topic": AI tự tạo từ mới theo chủ đề; "provided": AI chỉ biên soạn đúng danh sách từ giáo viên cung cấp (không thêm/bớt từ)',
  })
  @IsIn(['topic', 'provided'], {
    message: 'mode chỉ chấp nhận "topic" hoặc "provided"',
  })
  mode: 'topic' | 'provided';

  @ApiPropertyOptional({
    example: 'Contracts & Business Agreements (TOEIC 2)',
    description: 'Chủ đề hoặc ngữ cảnh bài học để AI định hướng nghĩa & câu ví dụ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  topicContext?: string;

  @ApiPropertyOptional({
    example: 'B1',
    description: 'Trình độ mục tiêu (A1, A2, B1, B2, C1, C2)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng từ muốn AI tự tạo khi mode = "topic" (1 - 50)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['accountable', 'collaborate', 'negotiate'],
    description:
      'Danh sách từ vựng chính xác do giáo viên cung cấp (bắt buộc khi mode = "provided", tối đa 100 từ)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100, { message: 'Mỗi lần hỗ trợ tối đa 100 từ vựng do giáo viên cung cấp' })
  @IsString({ each: true })
  providedWords?: string[];

  @ApiPropertyOptional({
    example: 'Ưu tiên ngữ cảnh công sở TOEIC, giải thích ngắn gọn dễ nhớ',
    description: 'Ghi chú bổ sung cho AI khi tạo ví dụ và nghĩa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  extraInstructions?: string;
}
