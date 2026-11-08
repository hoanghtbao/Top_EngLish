/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema định nghĩa cấu trúc dữ liệu người dùng (Users collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // Mật khẩu đã băm bằng bcrypt, không bao giờ lưu dạng plain text
  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ type: String, enum: Role, default: Role.STUDENT })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  // Gamification: Chuỗi ngày học liên tục
  @Prop({ default: 0 })
  streak: number;

  // Ngày hoạt động học gần nhất dạng 'YYYY-MM-DD'
  @Prop({ default: null })
  lastActiveDate: string;

  // Lịch sử các ngày học gần nhất dạng ['YYYY-MM-DD', ...] để vẽ lịch Streak Duolingo
  @Prop({ type: [String], default: [] })
  activeDates: string[];

  // Tổng điểm kinh nghiệm tích lũy
  @Prop({ default: 0 })
  totalXP: number;

  // Hash của Refresh Token để xác thực và thu hồi phiên an toàn
  @Prop({ default: null })
  hashedRefreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Đánh index tối ưu cho bảng xếp hạng XP
UserSchema.index({ totalXP: -1 });
