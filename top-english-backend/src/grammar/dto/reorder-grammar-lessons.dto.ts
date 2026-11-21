import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class ReorderGrammarLessonsDto {
  @ApiProperty({ type: [String], description: 'Danh sách ID bài học theo thứ tự mới' })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  orderedIds: string[];
}
