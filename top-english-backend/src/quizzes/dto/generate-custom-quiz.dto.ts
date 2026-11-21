/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tạo đề luyện thi ngẫu nhiên từ các bài Flashcard và Ngữ pháp đã chọn
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateCustomQuizDto {
  @ApiPropertyOptional({
    example: 'Ôn tập TE2 Lesson 1-3 + Thì Hiện Tại Đơn',
    description: 'Tiêu đề đề luyện thi tùy chỉnh (tự sinh nếu bỏ trống)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách ID các bài học Từ vựng Flashcard được chọn',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Mỗi topicId phải là ObjectId hợp lệ' })
  topicIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách ID các bài học Ngữ pháp được chọn',
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Mỗi grammarLessonId phải là ObjectId hợp lệ' })
  grammarLessonIds?: string[];

  @ApiProperty({
    example: 20,
    description: 'Số lượng câu hỏi muốn random từ tổng ngân hàng bài đã chọn',
  })
  @IsInt({ message: 'Số câu hỏi phải là số nguyên' })
  @Min(1, { message: 'Số câu hỏi tối thiểu là 1' })
  @Max(100, { message: 'Số câu hỏi tối đa cho 1 đề là 100' })
  questionCount: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Thời gian làm bài tính bằng phút (tự tính theo số câu nếu bỏ trống)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes?: number;

  @ApiPropertyOptional({
    enum: ['en_to_vi', 'vi_to_en', 'mixed_abcd', 'mixed_all'],
    default: 'mixed_abcd',
    description: 'Chế độ sinh câu hỏi cho phần Từ vựng Flashcard',
  })
  @IsOptional()
  @IsIn(['en_to_vi', 'vi_to_en', 'mixed_abcd', 'mixed_all'], {
    message: 'Chế độ câu hỏi từ vựng không hợp lệ',
  })
  vocabQuestionMode?: 'en_to_vi' | 'vi_to_en' | 'mixed_abcd' | 'mixed_all';
}
