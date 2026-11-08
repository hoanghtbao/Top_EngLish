/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật trạng thái hoạt động của tài khoản (Admin)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ example: false, description: 'Trạng thái hoạt động (true: kích hoạt, false: khóa)' })
  @IsBoolean({ message: 'isActive phải là kiểu boolean (true hoặc false)' })
  @IsNotEmpty({ message: 'isActive không được để trống' })
  isActive: boolean;
}
