/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa bài tập được giao trong lớp học (Assignment)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Classroom } from './classroom.schema';
import { User } from '../../users/schemas/user.schema';

export type AssignmentDocument = Assignment & Document;

export enum AssignmentType {
  QUIZ = 'quiz',
  VOCABULARY = 'vocabulary',
  GRAMMAR = 'grammar',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true, collection: 'assignments' })
export class Assignment {
  // Lớp học được giao bài tập
  @Prop({ type: Types.ObjectId, ref: Classroom.name, required: true, index: true })
  classroom: Types.ObjectId;

  // Tiêu đề bài tập
  @Prop({ required: true, trim: true })
  title: string;

  // Hướng dẫn làm bài của giáo viên
  @Prop({ default: '', trim: true })
  description: string;

  // Phân loại bài tập
  @Prop({ type: String, enum: AssignmentType, default: AssignmentType.QUIZ })
  type: AssignmentType;

  // ID tài liệu nguồn được giao (Topic ID, GrammarLesson ID hoặc Quiz ID)
  @Prop({ default: null, trim: true })
  targetId: string;

  // Tên rút gọn của tài liệu nguồn để hiển thị nhanh không cần join
  @Prop({ default: '', trim: true })
  targetTitle: string;

  // Giáo viên giao bài tập
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  teacher: Types.ObjectId;

  // Thời hạn nộp bài tập (hạn chót)
  @Prop({ required: true })
  dueDate: Date;

  // Điểm số tối đa cho bài tập này (mặc định: 100 điểm)
  @Prop({ default: 100 })
  maxScore: number;

  // Trạng thái kích hoạt của bài tập
  @Prop({ default: true })
  isActive: boolean;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
