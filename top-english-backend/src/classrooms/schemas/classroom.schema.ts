/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa lớp học trực tuyến (Classroom)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ClassroomDocument = Classroom & Document;

@Schema({ timestamps: true, collection: 'classrooms' })
export class Classroom {
  // Tên lớp học (ví dụ: "Tiếng Anh Giao Tiếp Cơ Bản K26")
  @Prop({ required: true, trim: true })
  name: string;

  // Mã tham gia lớp học độc nhất (ví dụ: "TOP-8K2F")
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  // Mô tả mục tiêu, lộ trình của lớp học
  @Prop({ default: '', trim: true })
  description: string;

  // Cấp độ trình độ (A1, A2, B1, B2, C1, IELTS, TOEIC...)
  @Prop({ default: 'B1 - Intermediate', trim: true })
  gradeLevel: string;

  // Màu chủ đề đại diện (emerald, teal, blue, indigo, purple, amber, rose)
  @Prop({ default: 'emerald', trim: true })
  themeColor: string;

  // Giáo viên phụ trách lớp học
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  teacher: Types.ObjectId;

  // Danh sách các học viên đã tham gia lớp
  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  students: Types.ObjectId[];

  // Giới hạn sĩ số lớp học (0 nghĩa là không giới hạn)
  @Prop({ default: 50 })
  maxStudents: number;

  // Trạng thái lớp học (đang mở hay lưu trữ)
  @Prop({ default: true })
  isActive: boolean;
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom);
