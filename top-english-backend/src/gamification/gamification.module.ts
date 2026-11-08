/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý Bảng xếp hạng và Hệ thống Huy hiệu Gamification
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  VocabularyReview,
  VocabularyReviewSchema,
} from '../srs/schemas/vocabulary-review.schema';
import {
  QuizSubmission,
  QuizSubmissionSchema,
} from '../quizzes/schemas/quiz-submission.schema';
import {
  Submission,
  SubmissionSchema,
} from '../classrooms/schemas/submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VocabularyReview.name, schema: VocabularyReviewSchema },
      { name: QuizSubmission.name, schema: QuizSubmissionSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
