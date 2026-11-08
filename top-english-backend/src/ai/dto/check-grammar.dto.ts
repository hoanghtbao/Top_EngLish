/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO kiểm tra và sửa lỗi ngữ pháp tiếng Anh
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CheckGrammarDto {
  @ApiProperty({
    description: 'Đoạn văn hoặc câu tiếng Anh cần kiểm tra và sửa lỗi',
    example: "She don't likes apple and listen music every days.",
  })
  @IsString({ message: 'Văn bản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Văn bản không được để trống' })
  @MinLength(2, { message: 'Văn bản phải có ít nhất 2 ký tự' })
  @MaxLength(1000, { message: 'Văn bản không được vượt quá 1000 ký tự' })
  text: string;
}
