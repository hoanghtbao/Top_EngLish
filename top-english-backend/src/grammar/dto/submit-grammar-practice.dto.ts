import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class GrammarPracticeAnswerItemDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  questionIndex: number;

  @ApiProperty({ example: 'goes' })
  @IsString()
  answer: string;
}

export class SubmitGrammarPracticeDto {
  @ApiProperty({ type: [GrammarPracticeAnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrammarPracticeAnswerItemDto)
  answers: GrammarPracticeAnswerItemDto[];
}
