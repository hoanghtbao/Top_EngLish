/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module Quản trị hệ thống & Báo cáo số liệu toàn diện (Admin Dashboard)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Topic, TopicSchema } from '../topics/schemas/topic.schema';
import {
  Vocabulary,
  VocabularySchema,
} from '../vocabulary/schemas/vocabulary.schema';
import {
  GrammarLesson,
  GrammarLessonSchema,
} from '../grammar/schemas/grammar-lesson.schema';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import {
  Question,
  QuestionSchema,
} from '../quizzes/schemas/question.schema';
import {
  Classroom,
  ClassroomSchema,
} from '../classrooms/schemas/classroom.schema';
import {
  SystemSetting,
  SystemSettingSchema,
} from './schemas/system-setting.schema';
import { SettingsController } from './settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Vocabulary.name, schema: VocabularySchema },
      { name: GrammarLesson.name, schema: GrammarLessonSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Classroom.name, schema: ClassroomSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
    ]),
  ],
  controllers: [AdminController, SettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
