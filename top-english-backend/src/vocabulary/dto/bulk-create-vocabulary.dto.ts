/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO thêm hàng loạt thẻ từ vựng vào chủ đề từ dữ liệu JSON
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PartOfSpeech } from '../enums/part-of-speech.enum';

export class BulkVocabularyItemDto {
  @ApiProperty({ example: 'Collaborate', description: 'Từ tiếng Anh' })
  @IsString({ message: 'Từ tiếng Anh phải là chuỗi' })
  @IsNotEmpty({ message: 'Từ tiếng Anh không được để trống' })
  word: string;

  @ApiPropertyOptional({ example: '/kəˈlæb.ə.reɪt/', description: 'Phiên âm quốc tế IPA' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ enum: PartOfSpeech, example: PartOfSpeech.VERB, description: 'Từ loại' })
  @IsOptional()
  @IsEnum(PartOfSpeech, { message: 'Từ loại phải là: noun, verb, adjective, adverb, preposition, conjunction hoặc phrase' })
  partOfSpeech?: PartOfSpeech;

  @ApiProperty({ example: 'Hợp tác, cộng tác', description: 'Nghĩa tiếng Việt' })
  @IsString({ message: 'Nghĩa tiếng Việt phải là chuỗi' })
  @IsNotEmpty({ message: 'Nghĩa tiếng Việt không được để trống' })
  meaning: string;

  @ApiPropertyOptional({ example: 'Teams collaborate across departments to finish faster.' })
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiPropertyOptional({ example: 'Các nhóm hợp tác xuyên phòng ban để hoàn thành nhanh hơn.' })
  @IsOptional()
  @IsString()
  exampleMeaning?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  audioUrl?: string;
}

export class BulkCreateVocabularyDto {
  @ApiProperty({ example: '6aede4deab12ea647b67d909', description: 'ID của chủ đề cần thêm từ vựng' })
  @IsMongoId({ message: 'topicId phải là một MongoDB ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'topicId không được để trống' })
  topicId: string;

  @ApiProperty({ type: [BulkVocabularyItemDto], description: 'Danh sách từ vựng cần nhập hàng loạt (tối đa 200 từ/lần)' })
  @IsArray({ message: 'items phải là một mảng danh sách từ vựng' })
  @ArrayMinSize(1, { message: 'Danh sách phải có ít nhất 1 từ vựng' })
  @ArrayMaxSize(200, { message: 'Mỗi lần chỉ được nhập tối đa 200 từ vựng' })
  @ValidateNested({ each: true })
  @Type(() => BulkVocabularyItemDto)
  items: BulkVocabularyItemDto[];
}
