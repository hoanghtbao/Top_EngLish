/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý chủ đề học từ vựng
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService, MongooseModule],
})
export class TopicsModule {}
