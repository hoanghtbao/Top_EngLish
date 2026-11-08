/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO trò chuyện với Gia sư AI tiếng Anh
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatMessageItem {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Phân biệt sự khác nhau giữa listen và hear?' })
  @IsString()
  content: string;
}

export class ChatAiDto {
  @ApiProperty({
    description: 'Câu hỏi hoặc lời nhắn của học viên gửi tới Gia sư AI',
    example: 'Phân biệt sự khác nhau giữa listen và hear trong tiếng Anh?',
  })
  @IsString({ message: 'Lời nhắn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Lời nhắn không được để trống' })
  @MaxLength(2000, { message: 'Lời nhắn không được vượt quá 2000 ký tự' })
  message: string;

  @ApiPropertyOptional({
    description: 'Lịch sử cuộc hội thoại trước đó (nếu có)',
    type: [ChatMessageItem],
  })
  @IsOptional()
  @IsArray({ message: 'Lịch sử phải là một danh sách' })
  history?: ChatMessageItem[];
}
