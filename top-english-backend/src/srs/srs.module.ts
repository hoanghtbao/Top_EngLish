/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý thuật toán lặp lại ngắt quãng SRS và Dashboard tiến độ học tập
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VocabularyReview,
  VocabularyReviewSchema,
} from './schemas/vocabulary-review.schema';
import { SrsService } from './srs.service';
import { SrsController } from './srs.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Vocabulary,
  VocabularySchema,
} from '../vocabulary/schemas/vocabulary.schema';
import {
  GrammarLesson,
  GrammarLessonSchema,
} from '../grammar/schemas/grammar-lesson.schema';
import {
  UserGrammarProgress,
  UserGrammarProgressSchema,
} from '../grammar/schemas/user-grammar-progress.schema';
import {
  QuizSubmission,
  QuizSubmissionSchema,
} from '../quizzes/schemas/quiz-submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabularyReview.name, schema: VocabularyReviewSchema },
      { name: User.name, schema: UserSchema },
      { name: Vocabulary.name, schema: VocabularySchema },
      { name: GrammarLesson.name, schema: GrammarLessonSchema },
      { name: UserGrammarProgress.name, schema: UserGrammarProgressSchema },
      { name: QuizSubmission.name, schema: QuizSubmissionSchema },
    ]),
  ],
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService, MongooseModule],
})
export class SrsModule {}
