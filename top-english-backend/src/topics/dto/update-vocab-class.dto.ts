/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật thông tin Lớp học từ vựng
 */

import { PartialType } from '@nestjs/swagger';
import { CreateVocabClassDto } from './create-vocab-class.dto';

export class UpdateVocabClassDto extends PartialType(CreateVocabClassDto) {}
