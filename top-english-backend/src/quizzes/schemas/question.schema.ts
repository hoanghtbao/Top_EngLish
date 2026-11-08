/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc câu hỏi kiểm tra (Questions collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuestionType } from '../enums/question-type.enum';
import { Quiz } from './quiz.schema';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  @Prop({ type: Types.ObjectId, ref: Quiz.name, required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  questionText: string;

  @Prop({ type: String, enum: QuestionType, default: QuestionType.MULTIPLE_CHOICE })
  type: QuestionType;

  // Danh sách các phương án cho câu hỏi trắc nghiệm
  @Prop({ type: [String], default: [] })
  options: string[];

  // Đáp án chính xác (Bảo mật: không gửi về cho học viên khi đang làm bài)
  @Prop({ required: true, trim: true })
  correctAnswer: string;

  // Lời giải thích chi tiết vì sao đáp án đúng
  @Prop({ default: '' })
  explanation: string;

  @Prop({ default: 0 })
  order: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ quizId: 1, order: 1 });
