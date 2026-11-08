/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý thẻ từ vựng (Vocabularies)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vocabulary, VocabularySchema } from './schemas/vocabulary.schema';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { Topic, TopicSchema } from '../topics/schemas/topic.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vocabulary.name, schema: VocabularySchema },
      { name: Topic.name, schema: TopicSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService, MongooseModule],
})
export class VocabularyModule {}
