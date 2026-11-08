/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema lưu kết quả nộp bài kiểm tra và lịch sử chấm điểm (QuizSubmissions collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Quiz } from './quiz.schema';
import { User } from '../../users/schemas/user.schema';

export type QuizSubmissionDocument = QuizSubmission & Document;

@Schema({ _id: false })
export class QuestionAnswerResult {
  @Prop({ type: Types.ObjectId, required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  selectedAnswer: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ default: '' })
  explanation: string;
}

@Schema({ timestamps: true, collection: 'quiz_submissions' })
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Quiz.name, required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ type: [QuestionAnswerResult], default: [] })
  answers: QuestionAnswerResult[];

  @Prop({ required: true })
  score: number; // Điểm phần trăm (0 - 100%)

  @Prop({ required: true })
  correctCount: number;

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ default: false })
  passed: boolean; // score >= passingScore

  @Prop({ default: 0 })
  xpEarned: number; // Điểm kinh nghiệm nhận được
}

export const QuizSubmissionSchema = SchemaFactory.createForClass(QuizSubmission);

QuizSubmissionSchema.index({ userId: 1, quizId: 1, createdAt: -1 });
