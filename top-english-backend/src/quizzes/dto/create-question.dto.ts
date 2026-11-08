/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO thêm câu hỏi mới vào đề kiểm tra
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { QuestionType } from '../enums/question-type.enum';

export class CreateQuestionDto {
  @ApiPropertyOptional({ example: '6aedf9c64228074eb651731f', description: 'ID của đề thi chứa câu hỏi này' })
  @IsOptional()
  @IsMongoId({ message: 'quizId phải là ObjectId hợp lệ' })
  quizId?: string;

  @ApiProperty({ example: 'What is an "Algorithm" in computer science?', description: 'Nội dung câu hỏi' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  questionText: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE, description: 'Loại câu hỏi (multiple_choice, fill_in_the_blank)' })
  @IsEnum(QuestionType, { message: 'Loại câu hỏi không hợp lệ' })
  @IsNotEmpty({ message: 'Loại câu hỏi không được để trống' })
  type: QuestionType;

  @ApiPropertyOptional({ type: [String], example: ['A procedure', 'A keyboard'], description: 'Danh sách các lựa chọn (đối với trắc nghiệm)' })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty({ example: 'A procedure', description: 'Đáp án chính xác' })
  @IsString()
  @IsNotEmpty({ message: 'Đáp án chính xác không được để trống' })
  correctAnswer: string;

  @ApiPropertyOptional({ example: 'Giải thích chi tiết vì sao phương án này chính xác', description: 'Lời giải thích đáp án' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự câu hỏi trong đề thi' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
