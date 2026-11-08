/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật thông tin lớp học
 */

import { PartialType } from '@nestjs/swagger';
import { CreateClassroomDto } from './create-classroom.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassroomDto extends PartialType(CreateClassroomDto) {
  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động của lớp học' })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  isActive?: boolean;
}
