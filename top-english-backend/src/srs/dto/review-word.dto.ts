/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO ghi nhận kết quả đánh giá thẻ từ vựng trong thuật toán SRS
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { SrsRating } from '../enums/srs-rating.enum';

export class ReviewWordDto {
  @ApiProperty({ example: '6aedf4b8e5b6a69e19e4af9c', description: 'ID của từ vựng vừa ôn tập' })
  @IsMongoId({ message: 'vocabularyId phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'vocabularyId không được để trống' })
  vocabularyId: string;

  @ApiProperty({ enum: SrsRating, example: SrsRating.GOOD, description: 'Mức độ nhớ (again, hard, good, easy)' })
  @IsEnum(SrsRating, { message: 'Mức độ đánh giá không hợp lệ' })
  @IsNotEmpty({ message: 'rating không được để trống' })
  rating: SrsRating;
}
