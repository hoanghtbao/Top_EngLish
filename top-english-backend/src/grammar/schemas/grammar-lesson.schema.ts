/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc bài học ngữ pháp (GrammarLessons collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EnglishLevel } from '../../topics/enums/english-level.enum';
import { User } from '../../users/schemas/user.schema';

export type GrammarLessonDocument = GrammarLesson & Document;

@Schema({ _id: false })
export class GrammarFormula {
  @Prop({ default: '' })
  positive: string; // Khẳng định: S + V...

  @Prop({ default: '' })
  negative: string; // Phủ định: S + not...

  @Prop({ default: '' })
  question: string; // Nghi vấn: Do/Does + S...
}

@Schema({ _id: false })
export class GrammarExample {
  @Prop({ required: true })
  en: string;

  @Prop({ required: true })
  vi: string;

  @Prop({ default: '' })
  note?: string;
}

@Schema({ _id: false })
export class CommonMistake {
  @Prop({ required: true })
  wrong: string;

  @Prop({ required: true })
  correct: string;

  @Prop({ required: true })
  reason: string;
}

@Schema({ timestamps: true, collection: 'grammar_lessons' })
export class GrammarLesson {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, enum: EnglishLevel, default: EnglishLevel.A1 })
  level: EnglishLevel;

  @Prop({ required: true, trim: true, default: 'Tenses' })
  category: string; // 'Tenses', 'Conditionals', 'Passive Voice', 'Modal Verbs'...

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: GrammarFormula, default: () => ({}) })
  formula: GrammarFormula;

  @Prop({ type: [String], default: [] })
  usage: string[];

  @Prop({ type: [String], default: [] })
  signals: string[]; // Dấu hiệu nhận biết: always, usually, yesterday, since, for...

  @Prop({ type: [GrammarExample], default: [] })
  examples: GrammarExample[];

  @Prop({ type: [CommonMistake], default: [] })
  commonMistakes: CommonMistake[];

  @Prop({ default: '' })
  content: string; // Nội dung bổ trợ dạng Markdown

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const GrammarLessonSchema = SchemaFactory.createForClass(GrammarLesson);

GrammarLessonSchema.index({ level: 1, order: 1 });
GrammarLessonSchema.index({ category: 1, order: 1 });
GrammarLessonSchema.index({ title: 'text', summary: 'text' });
