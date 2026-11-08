/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO thêm từ vựng mới vào chủ đề
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartOfSpeech } from '../enums/part-of-speech.enum';

export class CreateVocabularyDto {
  @ApiProperty({ example: '6aede4deab12ea647b67d909', description: 'ID của chủ đề chứa từ này' })
  @IsMongoId({ message: 'topicId phải là một MongoDB ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'topicId không được để trống' })
  topicId: string;

  @ApiProperty({ example: 'Algorithm', description: 'Từ tiếng Anh' })
  @IsString()
  @IsNotEmpty({ message: 'Từ tiếng Anh không được để trống' })
  word: string;

  @ApiPropertyOptional({ example: '/ˈæl.ɡə.rɪ.ðəm/', description: 'Phiên âm quốc tế IPA' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiProperty({ enum: PartOfSpeech, example: PartOfSpeech.NOUN, description: 'Từ loại' })
  @IsEnum(PartOfSpeech, { message: 'Từ loại không hợp lệ' })
  @IsNotEmpty({ message: 'Từ loại không được để trống' })
  partOfSpeech: PartOfSpeech;

  @ApiProperty({ example: 'Thuật toán', description: 'Nghĩa tiếng Việt' })
  @IsString()
  @IsNotEmpty({ message: 'Nghĩa tiếng Việt không được để trống' })
  meaning: string;

  @ApiPropertyOptional({ example: 'The search algorithm ranks results by relevance.' })
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiPropertyOptional({ example: 'Thuật toán tìm kiếm xếp hạng kết quả theo độ liên quan.' })
  @IsOptional()
  @IsString()
  exampleMeaning?: string;

  @ApiPropertyOptional({ example: 'https://dictionary.cambridge.org/media/english/us_pron/a/alg/algor/algorithm.mp3' })
  @IsOptional()
  @IsString()
  audioUrl?: string;
}
