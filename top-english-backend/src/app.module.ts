/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Module gốc (Root Module) nạp cấu hình hệ thống, kết nối MongoDB và các module tính năng
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TopicsModule } from './topics/topics.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { GrammarModule } from './grammar/grammar.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SrsModule } from './srs/srs.module';
import { AiModule } from './ai/ai.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { GamificationModule } from './gamification/gamification.module';
import { LiveGameModule } from './live-game/live-game.module';
import { AdminModule } from './admin/admin.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // 1. Quản lý biến môi trường toàn cục (.env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'top-english-backend/.env'],
    }),

    // 2. Kết nối cơ sở dữ liệu MongoDB qua Mongoose
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/top_english',
      }),
    }),

    // 3. Giám sát & Telemetry của NestJS
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'top-english-backend',
    }),

    // 4. Module kiểm tra trạng thái sức khỏe hệ thống
    HealthModule,

    // 5. Module quản lý người dùng
    UsersModule,

    // 6. Module xác thực & Phân quyền
    AuthModule,

    // 7. Module chủ đề học tiếng Anh
    TopicsModule,

    // 8. Module thẻ từ vựng Flashcard
    VocabularyModule,

    // 9. Module bài học ngữ pháp
    GrammarModule,

    // 10. Module bài tập & đề thi trắc nghiệm
    QuizzesModule,

    // 11. Module thuật toán lặp lại ngắt quãng (SRS) & Dashboard tiến độ
    SrsModule,

    // 12. Module Trợ lý Trí tuệ Nhân tạo AI
    AiModule,

    // 13. Module Lớp học trực tuyến & Bài tập
    ClassroomsModule,

    // 14. Module Đấu trường Xếp hạng & Gamification
    GamificationModule,

    // 15. Module Đấu Trường Leo Núi Thời Gian Thực (Live Game)
    LiveGameModule,

    // 16. Module Bảng Quản Trị Hệ Thống & Báo Cáo Số Liệu (Admin)
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
