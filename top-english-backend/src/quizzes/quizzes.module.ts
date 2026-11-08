/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý đề thi, câu hỏi trắc nghiệm và chấm điểm kết quả (Quizzes Module)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { Question, QuestionSchema } from './schemas/question.schema';
import {
  QuizSubmission,
  QuizSubmissionSchema,
} from './schemas/quiz-submission.schema';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Topic, TopicSchema } from '../topics/schemas/topic.schema';
import {
  GrammarLesson,
  GrammarLessonSchema,
} from '../grammar/schemas/grammar-lesson.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuizSubmission.name, schema: QuizSubmissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: GrammarLesson.name, schema: GrammarLessonSchema },
    ]),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService, MongooseModule],
})
export class QuizzesModule {}
