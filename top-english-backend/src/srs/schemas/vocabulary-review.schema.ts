/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Mongoose Schema lưu trữ trạng thái ôn tập ngắt quãng của học viên (VocabularyReviews collection)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Vocabulary } from '../../vocabulary/schemas/vocabulary.schema';

export type VocabularyReviewDocument = VocabularyReview & Document;

@Schema({ timestamps: true, collection: 'vocabulary_reviews' })
export class VocabularyReview {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Vocabulary.name, required: true, index: true })
  vocabularyId: Types.ObjectId;

  // Cấp độ lặp lại: 0 (Mới/Quên), 1 (1 ngày), 2 (3 ngày), 3 (7 ngày), 4 (14-30 ngày - Mastered)
  @Prop({ default: 0, min: 0, max: 4 })
  repetitionLevel: number;

  // Thời điểm đến hạn cần ôn tập kế tiếp (Spaced Repetition Due Date)
  @Prop({ required: true, index: true })
  nextReviewDate: Date;

  @Prop({ default: Date.now })
  lastReviewedAt: Date;

  @Prop({ default: 1 })
  reviewCount: number;

  // Đã đưa vào trí nhớ dài hạn (Level 4)
  @Prop({ default: false })
  isMastered: boolean;
}

export const VocabularyReviewSchema = SchemaFactory.createForClass(VocabularyReview);

// Mỗi học viên chỉ có 1 bản ghi chu kỳ ôn tập cho từng từ vựng
VocabularyReviewSchema.index({ userId: 1, vocabularyId: 1 }, { unique: true });

// Tối ưu truy vấn danh sách từ đến hạn ôn hôm nay
VocabularyReviewSchema.index({ userId: 1, nextReviewDate: 1 });
VocabularyReviewSchema.index({ userId: 1, isMastered: 1 });
