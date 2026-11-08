/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật từ vựng
 */

import { PartialType } from '@nestjs/swagger';
import { CreateVocabularyDto } from './create-vocabulary.dto';

export class UpdateVocabularyDto extends PartialType(CreateVocabularyDto) {}
