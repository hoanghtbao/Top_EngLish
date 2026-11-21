import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AssignGrammarClassroomsDto {
  @ApiProperty({ type: [String], description: 'Danh sách ID các lớp học được giao bài' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Vui lòng chọn ít nhất 1 lớp học' })
  @IsMongoId({ each: true })
  classroomIds: string[];

  @ApiProperty({ example: '2026-12-01T23:59:59.000Z', description: 'Hạn chót hoàn thành (ISO 8601)' })
  @IsDateString({}, { message: 'Hạn chót không đúng định dạng ngày tháng' })
  dueDate: string;

  @ApiPropertyOptional({ description: 'Lời dặn dò của giáo viên dành cho học sinh' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxScore?: number;
}
