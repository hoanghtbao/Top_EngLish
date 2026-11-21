/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc bài học / chủ đề từ vựng (Topics collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EnglishLevel } from '../enums/english-level.enum';
import { User } from '../../users/schemas/user.schema';
import { VocabClass } from './vocab-class.schema';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true, collection: 'topics' })
export class Topic {
  @Prop({ type: Types.ObjectId, ref: VocabClass.name, default: null, index: true })
  vocabClassId: Types.ObjectId | null;

  @Prop({ default: 1 })
  lessonNumber: number;

  @Prop({ default: '', trim: true })
  tag: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  image: string;

  @Prop({ type: String, enum: EnglishLevel, default: EnglishLevel.B1 })
  level: EnglishLevel;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// Đánh index tối ưu cho lọc bài học theo lớp và sắp xếp theo số bài
TopicSchema.index({ vocabClassId: 1, lessonNumber: 1, createdAt: 1 });
TopicSchema.index({ level: 1, createdAt: -1 });
TopicSchema.index({ title: 'text', description: 'text', tag: 'text' });
