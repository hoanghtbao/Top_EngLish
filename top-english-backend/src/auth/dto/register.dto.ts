/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO kiểm tra dữ liệu đăng ký tài khoản mới
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@topenglish.com', description: 'Email của người dùng' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu tối thiểu 6 ký tự' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người dùng' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;
}
