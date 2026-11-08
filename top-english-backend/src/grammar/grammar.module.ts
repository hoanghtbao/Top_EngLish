/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý bài học ngữ pháp và tiến độ học tập
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GrammarLesson,
  GrammarLessonSchema,
} from './schemas/grammar-lesson.schema';
import {
  UserGrammarProgress,
  UserGrammarProgressSchema,
} from './schemas/user-grammar-progress.schema';
import { GrammarService } from './grammar.service';
import { GrammarController } from './grammar.controller';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GrammarLesson.name, schema: GrammarLessonSchema },
      { name: UserGrammarProgress.name, schema: UserGrammarProgressSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GrammarController],
  providers: [GrammarService],
  exports: [GrammarService, MongooseModule],
})
export class GrammarModule {}
