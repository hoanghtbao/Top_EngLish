/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO thêm bài học ngữ pháp mới
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { EnglishLevel } from '../../topics/enums/english-level.enum';

export class GrammarFormulaDto {
  @ApiPropertyOptional({ example: 'S + V(s/es) + O', description: 'Cấu trúc câu khẳng định' })
  @IsOptional()
  @IsString()
  positive?: string;

  @ApiPropertyOptional({ example: 'S + do/does not + V(bare) + O', description: 'Cấu trúc câu phủ định' })
  @IsOptional()
  @IsString()
  negative?: string;

  @ApiPropertyOptional({ example: 'Do/Does + S + V(bare) + O?', description: 'Cấu trúc câu nghi vấn' })
  @IsOptional()
  @IsString()
  question?: string;
}

export class GrammarExampleDto {
  @ApiProperty({ example: 'She drinks coffee every morning.', description: 'Câu tiếng Anh' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Cô ấy uống cà phê mỗi buổi sáng.', description: 'Dịch nghĩa tiếng Việt' })
  @IsString()
  @IsNotEmpty()
  vi: string;

  @ApiPropertyOptional({ example: 'Chủ ngữ ngôi thứ 3 số ít', description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CommonMistakeDto {
  @ApiProperty({ example: 'He go to school.', description: 'Câu sai thường gặp' })
  @IsString()
  @IsNotEmpty()
  wrong: string;

  @ApiProperty({ example: 'He goes to school.', description: 'Câu đúng chuẩn' })
  @IsString()
  @IsNotEmpty()
  correct: string;

  @ApiProperty({ example: 'Chủ ngữ He là ngôi thứ 3 số ít, động từ phải thêm -es', description: 'Giải thích nguyên nhân' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateGrammarLessonDto {
  @ApiProperty({ example: 'Thì Hiện Tại Đơn (Present Simple)', description: 'Tiêu đề bài học ngữ pháp' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  title: string;

  @ApiPropertyOptional({ example: 'present-simple-tense', description: 'Slug URL (tự động tạo nếu để trống)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: EnglishLevel, example: EnglishLevel.A1, description: 'Trình độ CEFR (A1 - C2)' })
  @IsEnum(EnglishLevel, { message: 'Trình độ CEFR không hợp lệ' })
  @IsNotEmpty({ message: 'Trình độ CEFR không được để trống' })
  level: EnglishLevel;

  @ApiProperty({ example: 'Tenses', description: 'Chuyên mục ngữ pháp (Tenses, Conditionals, Passive Voice...)' })
  @IsString()
  @IsNotEmpty({ message: 'Chuyên mục ngữ pháp không được để trống' })
  category: string;

  @ApiPropertyOptional({ example: 'Nắm vững cách dùng, cấu trúc khẳng định, phủ định, nghi vấn và dấu hiệu nhận biết thì hiện tại đơn.' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: GrammarFormulaDto, description: 'Công thức ngữ pháp' })
  @IsOptional()
  @IsObject()
  formula?: GrammarFormulaDto;

  @ApiPropertyOptional({ type: [String], example: ['Diễn tả thói quen hàng ngày', 'Chân lý hiển nhiên'], description: 'Các trường hợp sử dụng' })
  @IsOptional()
  @IsArray()
  usage?: string[];

  @ApiPropertyOptional({ type: [String], example: ['always', 'usually', 'every day'], description: 'Dấu hiệu nhận biết' })
  @IsOptional()
  @IsArray()
  signals?: string[];

  @ApiPropertyOptional({ type: [GrammarExampleDto], description: 'Các câu ví dụ minh họa' })
  @IsOptional()
  @IsArray()
  examples?: GrammarExampleDto[];

  @ApiPropertyOptional({ type: [CommonMistakeDto], description: 'Các lỗi sai thường gặp' })
  @IsOptional()
  @IsArray()
  commonMistakes?: CommonMistakeDto[];

  @ApiPropertyOptional({ description: 'Nội dung bài giảng chi tiết (hỗ trợ Markdown)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 1, description: 'Thứ tự hiển thị bài học trong chuyên mục' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
