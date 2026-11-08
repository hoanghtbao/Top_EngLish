/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description DTO cập nhật bài học ngữ pháp
 */

import { PartialType } from '@nestjs/swagger';
import { CreateGrammarLessonDto } from './create-grammar-lesson.dto';

export class UpdateGrammarLessonDto extends PartialType(CreateGrammarLessonDto) {}
