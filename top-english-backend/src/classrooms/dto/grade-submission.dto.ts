/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO chấm điểm và gửi phản hồi nhận xét bài làm của học viên
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GradeSubmissionDto {
  @ApiProperty({ example: 95, description: 'Điểm số bài làm (0 - 100)' })
  @IsNumber({}, { message: 'Điểm số phải là số' })
  @IsNotEmpty({ message: 'Điểm số không được để trống' })
  @Min(0, { message: 'Điểm số không được nhỏ hơn 0' })
  @Max(1000, { message: 'Điểm số không được vượt quá 1000' })
  score: number;

  @ApiPropertyOptional({ example: 'Bài làm rất tốt, cách phát âm và dùng thì quá khứ hoàn thành rất tự nhiên!', description: 'Lời nhận xét của giáo viên' })
  @IsOptional()
  @IsString({ message: 'Lời nhận xét phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Lời nhận xét không được vượt quá 1000 ký tự' })
  teacherFeedback?: string;
}
