/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý Lớp học từ vựng (VocabClasses) và Bài học (Topics)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { VocabClass, VocabClassSchema } from './schemas/vocab-class.schema';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VocabClass.name, schema: VocabClassSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService, MongooseModule],
})
export class TopicsModule {}
