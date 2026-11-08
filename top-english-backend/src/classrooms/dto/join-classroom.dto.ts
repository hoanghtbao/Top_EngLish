/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO nhập mã mời tham gia lớp học dành cho học viên
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassroomDto {
  @ApiProperty({ example: 'TOP-8K2F', description: 'Mã mời tham gia lớp học' })
  @IsString({ message: 'Mã lớp phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã lớp không được để trống' })
  @Length(4, 20, { message: 'Mã lớp học phải có từ 4 đến 20 ký tự' })
  code: string;
}
