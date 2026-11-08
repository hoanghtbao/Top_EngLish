/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO nộp bài kiểm tra để chấm điểm tự động
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnswerItemDto {
  @ApiProperty({ example: '6aedf9c64228074eb651731f', description: 'ID của câu hỏi' })
  @IsMongoId({ message: 'questionId phải là ObjectId hợp lệ' })
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: 'A step-by-step procedure for solving a problem', description: 'Câu trả lời của học viên' })
  @IsString()
  selectedAnswer: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [AnswerItemDto], description: 'Danh sách các câu trả lời của đề thi' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
