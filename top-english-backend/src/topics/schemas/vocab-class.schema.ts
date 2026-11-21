/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa Lớp học từ vựng (VocabClass) chứa danh sách bài học Flashcard
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type VocabClassDocument = VocabClass & Document;

@Schema({ timestamps: true, collection: 'vocab_classes' })
export class VocabClass {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const VocabClassSchema = SchemaFactory.createForClass(VocabClass);
VocabClassSchema.index({ name: 'text', code: 'text', description: 'text' });
