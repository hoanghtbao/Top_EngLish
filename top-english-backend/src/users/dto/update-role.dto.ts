/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật vai trò người dùng (Admin)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../enums/role.enum';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, example: Role.TEACHER, description: 'Vai trò mới' })
  @IsEnum(Role, { message: 'Vai trò phải là student, teacher hoặc admin' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: Role;
}
