/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa bài nộp của học viên trong lớp học (Submission)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Assignment } from './assignment.schema';
import { Classroom } from './classroom.schema';
import { User } from '../../users/schemas/user.schema';

export type SubmissionDocument = Submission & Document;

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late',
}

@Schema({ timestamps: true, collection: 'submissions' })
export class Submission {
  // Bài tập tương ứng
  @Prop({ type: Types.ObjectId, ref: Assignment.name, required: true, index: true })
  assignment: Types.ObjectId;

  // Lớp học chứa bài tập
  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: true, index: true })
  classroom: Types.ObjectId;

  // Học viên nộp bài
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  student: Types.ObjectId;

  // Trạng thái bài nộp (Đã nộp, Đã chấm, Nộp trễ)
  @Prop({ type: String, enum: SubmissionStatus, default: SubmissionStatus.SUBMITTED })
  status: SubmissionStatus;

  // Điểm số học viên đạt được (0 - maxScore)
  @Prop({ default: null })
  score: number;

  // Nội dung trả lời, bài làm hoặc ghi chú từ học viên
  @Prop({ default: '', trim: true })
  content: string;

  // ID kết quả làm bài trắc nghiệm QuizSubmission (nếu là bài tập Quiz)
  @Prop({ default: null })
  quizResultId: string;

  // Lời nhận xét, góp ý của Giáo viên
  @Prop({ default: '', trim: true })
  teacherFeedback: string;

  // Thời gian nộp bài thực tế
  @Prop({ default: Date.now })
  submittedAt: Date;

  // Thời gian giáo viên hoàn thành chấm điểm
  @Prop({ default: null })
  gradedAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Mỗi học viên chỉ có 1 bản ghi nộp bài cho một bài tập cụ thể
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
