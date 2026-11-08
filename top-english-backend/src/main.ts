/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Điểm khởi chạy ứng dụng NestJS Backend, thiết lập CORS, ValidationPipe, Filter, Interceptor và Swagger
 */

import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';
import * as fs from 'fs';
import { AppModule, ObserveInstrument } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  // Phục vụ tệp tĩnh (Tải ảnh nền, avatar, media)
  const uploadsDir = resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // 1. Tiền tố toàn cục cho API
  app.setGlobalPrefix('api/v1');

  // Lấy ConfigService từ Nest container
  const configService = app.get(ConfigService);

  // 2. Cấu hình CORS cho phép Frontend kết nối
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
  });

  // 3. Validation Pipe tự động kiểm tra DTO dữ liệu đầu vào
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Interceptor chuẩn hóa dữ liệu phản hồi (Unified API Response)
  app.useGlobalInterceptors(new TransformInterceptor());

  // 5. Filter xử lý và bắt toàn bộ ngoại lệ hệ thống
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Cấu hình Swagger UI tài liệu API
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TopEnglish API Documentation')
    .setDescription(
      'Hệ thống tài liệu RESTful API cho nền tảng học tiếng Anh TopEnglish (Tác giả: HoangBao)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT Access Token vào đây',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'TopEnglish API Docs',
  });

  const port = configService.get<number>('PORT', 5001);
  await app.listen(port);
  logger.log(`🚀 Máy chủ TopEnglish Backend đang chạy tại: http://localhost:${port}/api/v1 (IPv4 & IPv6)`);
  logger.log(`📚 Tài liệu Swagger UI truy cập tại: http://localhost:${port}/api/docs`);
}

void bootstrap();
