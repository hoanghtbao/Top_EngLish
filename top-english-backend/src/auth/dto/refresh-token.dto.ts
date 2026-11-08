/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO gửi Refresh Token để cấp lại Access Token mới
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT Refresh Token được cấp khi đăng nhập' })
  @IsString({ message: 'Refresh Token phải là chuỗi' })
  @IsNotEmpty({ message: 'Refresh Token không được để trống' })
  refreshToken: string;
}
