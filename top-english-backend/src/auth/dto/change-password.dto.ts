/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO đổi mật khẩu người dùng
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: '123456', description: 'Mật khẩu cũ hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiProperty({ example: 'newpassword123', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' })
  newPassword: string;
}
