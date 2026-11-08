/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc thẻ từ vựng (Vocabularies collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PartOfSpeech } from '../enums/part-of-speech.enum';
import { Topic } from '../../topics/schemas/topic.schema';
import { User } from '../../users/schemas/user.schema';

export type VocabularyDocument = Vocabulary & Document;

@Schema({ timestamps: true, collection: 'vocabularies' })
export class Vocabulary {
  @Prop({ type: Types.ObjectId, ref: Topic.name, required: true, index: true })
  topicId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  word: string;

  // Phiên âm quốc tế IPA (ví dụ: /ˈvæk.siːn/)
  @Prop({ default: '', trim: true })
  phonetic: string;

  @Prop({ type: String, enum: PartOfSpeech, default: PartOfSpeech.NOUN })
  partOfSpeech: PartOfSpeech;

  // Nghĩa tiếng Việt của từ
  @Prop({ required: true, trim: true })
  meaning: string;

  // Câu ví dụ minh họa bằng tiếng Anh
  @Prop({ default: '', trim: true })
  exampleSentence: string;

  // Bản dịch nghĩa của câu ví dụ sang tiếng Việt
  @Prop({ default: '', trim: true })
  exampleMeaning: string;

  // Đường link audio phát âm từ vựng (dự phòng khi trình duyệt không có Web Speech API)
  @Prop({ default: null })
  audioUrl: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const VocabularySchema = SchemaFactory.createForClass(Vocabulary);

// Đánh index tối ưu tra cứu từ theo chủ đề và text search
VocabularySchema.index({ topicId: 1, createdAt: 1 });
VocabularySchema.index({ word: 'text', meaning: 'text' });
