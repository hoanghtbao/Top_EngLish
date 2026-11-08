/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tạo đề kiểm tra mới
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QuizType } from '../enums/quiz-type.enum';
import { EnglishLevel } from '../../topics/enums/english-level.enum';

export class CreateQuizDto {
  @ApiProperty({ example: 'Kiểm Tra Từ Vựng Công Nghệ & AI', description: 'Tiêu đề đề thi' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: 'Đánh giá khả năng hiểu và sử dụng từ vựng công nghệ', description: 'Mô tả bài kiểm tra' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: QuizType, example: QuizType.VOCABULARY, description: 'Loại bài thi (vocabulary, grammar, general)' })
  @IsEnum(QuizType, { message: 'Loại bài thi không hợp lệ' })
  @IsNotEmpty({ message: 'Loại bài thi không được để trống' })
  type: QuizType;

  @ApiProperty({ enum: EnglishLevel, example: EnglishLevel.B1, description: 'Cấp độ CEFR (A1 - C2)' })
  @IsEnum(EnglishLevel, { message: 'Cấp độ không hợp lệ' })
  @IsNotEmpty({ message: 'Cấp độ không được để trống' })
  level: EnglishLevel;

  @ApiPropertyOptional({ example: '6aedf4b8e5b6a69e19e4af9b', description: 'ID của chủ đề từ vựng liên quan' })
  @IsOptional()
  @IsMongoId({ message: 'topicId phải là ObjectId hợp lệ' })
  topicId?: string;

  @ApiPropertyOptional({ example: '6aedf9c64228074eb651731f', description: 'ID của bài học ngữ pháp liên quan' })
  @IsOptional()
  @IsMongoId({ message: 'grammarLessonId phải là ObjectId hợp lệ' })
  grammarLessonId?: string;

  @ApiPropertyOptional({ example: 10, description: 'Thời gian làm bài tính bằng phút' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 70, description: '% điểm tối thiểu để đạt bài thi' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;
}
