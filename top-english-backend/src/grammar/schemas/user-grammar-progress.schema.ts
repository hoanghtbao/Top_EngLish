/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema theo dõi tiến độ hoàn thành bài học ngữ pháp của học viên
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { GrammarLesson } from './grammar-lesson.schema';

export type UserGrammarProgressDocument = UserGrammarProgress & Document;

@Schema({ timestamps: true, collection: 'user_grammar_progress' })
export class UserGrammarProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: GrammarLesson.name, required: true, index: true })
  lessonId: Types.ObjectId;

  @Prop({ default: true })
  isCompleted: boolean;

  @Prop({ default: Date.now })
  completedAt: Date;
}

export const UserGrammarProgressSchema = SchemaFactory.createForClass(UserGrammarProgress);

// Đảm bảo mỗi học viên chỉ có 1 bản ghi tiến độ duy nhất cho mỗi bài học
UserGrammarProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
