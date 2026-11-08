/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc bài kiểm tra (Quizzes collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuizType } from '../enums/quiz-type.enum';
import { EnglishLevel } from '../../topics/enums/english-level.enum';
import { Topic } from '../../topics/schemas/topic.schema';
import { GrammarLesson } from '../../grammar/schemas/grammar-lesson.schema';
import { User } from '../../users/schemas/user.schema';

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true, collection: 'quizzes' })
export class Quiz {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: String, enum: QuizType, default: QuizType.GENERAL })
  type: QuizType;

  @Prop({ type: String, enum: EnglishLevel, default: EnglishLevel.A1 })
  level: EnglishLevel;

  @Prop({ type: Types.ObjectId, ref: Topic.name, default: null })
  topicId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: GrammarLesson.name, default: null })
  grammarLessonId?: Types.ObjectId | null;

  @Prop({ default: 10 })
  durationMinutes: number; // Thời gian làm bài tính bằng phút

  @Prop({ default: 70 })
  passingScore: number; // % điểm để đạt bài kiểm tra

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ type: 1, level: 1 });
QuizSchema.index({ topicId: 1 });
QuizSchema.index({ grammarLessonId: 1 });
