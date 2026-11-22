/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO kiểm tra mã trao đổi một lần (one-time exchange code) sau khi xác thực Google OAuth
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GoogleExchangeDto {
  @ApiProperty({
    description: 'Mã trao đổi một lần được cấp sau khi Google OAuth callback thành công',
    example: 'a1b2c3d4...',
  })
  @IsString({ message: 'Mã xác thực Google phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã xác thực Google không được để trống' })
  @Length(16, 256, { message: 'Mã xác thực Google không hợp lệ' })
  code: string;
}
