/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO tra cứu và phân tích chuyên sâu từ vựng tiếng Anh
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ExplainWordDto {
  @ApiProperty({
    description: 'Từ vựng hoặc cụm từ tiếng Anh cần phân tích',
    example: 'resilient',
  })
  @IsString({ message: 'Từ vựng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Từ vựng không được để trống' })
  @MinLength(1, { message: 'Từ vựng phải có ít nhất 1 ký tự' })
  @MaxLength(100, { message: 'Từ vựng không được vượt quá 100 ký tự' })
  word: string;

  @ApiPropertyOptional({
    description: 'Ngữ cảnh câu chứa từ vựng (nếu có)',
    example: 'Children are remarkably resilient in adapting to change.',
  })
  @IsOptional()
  @IsString({ message: 'Ngữ cảnh phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ngữ cảnh không được vượt quá 500 ký tự' })
  context?: string;
}
