import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateGrammarLessonDto {
  @ApiProperty({ example: 'Passive Voice - B1', description: 'Chủ đề hoặc tên bài ngữ pháp cần AI soạn gợi ý' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập chủ đề bài ngữ pháp' })
  @MaxLength(200)
  topic: string;

  @ApiPropertyOptional({ example: 'B1', description: 'Cấp độ CEFR (A1 - C2)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @ApiPropertyOptional({ example: 'Passive Voice', description: 'Chuyên đề ngữ pháp' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Yêu cầu bổ sung cho AI' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  extraInstructions?: string;
}
