/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc chủ đề từ vựng (Topics collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EnglishLevel } from '../enums/english-level.enum';
import { User } from '../../users/schemas/user.schema';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true, collection: 'topics' })
export class Topic {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  image: string;

  @Prop({ type: String, enum: EnglishLevel, default: EnglishLevel.A1 })
  level: EnglishLevel;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// Đánh index tối ưu cho lọc theo trình độ và danh sách theo thời gian
TopicSchema.index({ level: 1, createdAt: -1 });
TopicSchema.index({ title: 'text', description: 'text' });
