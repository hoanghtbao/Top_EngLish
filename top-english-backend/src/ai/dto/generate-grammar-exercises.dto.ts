import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GenerateGrammarExercisesDto {
  @ApiProperty({ example: 'Câu Bị Động (Passive Voice)' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài ngữ pháp không được để trống' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Passive Voice' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formula?: {
    positive?: string;
    negative?: string;
    question?: string;
  };

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  usage?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  signals?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  count?: number;

  @ApiPropertyOptional({ enum: ['mixed', 'mcq', 'fill_blank'], example: 'mixed' })
  @IsOptional()
  @IsIn(['mixed', 'mcq', 'fill_blank'])
  exerciseType?: 'mixed' | 'mcq' | 'fill_blank';
}
