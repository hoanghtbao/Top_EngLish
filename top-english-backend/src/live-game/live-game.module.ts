/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module quản lý Đấu Trường Leo Núi thời gian thực qua WebSockets và REST
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveGameService } from './live-game.service';
import { LiveGameGateway } from './live-game.gateway';
import { LiveGameController } from './live-game.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Quiz, QuizSchema } from '../quizzes/schemas/quiz.schema';
import { Question, QuestionSchema } from '../quizzes/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [LiveGameController],
  providers: [LiveGameService, LiveGameGateway],
  exports: [LiveGameService],
})
export class LiveGameModule {}
