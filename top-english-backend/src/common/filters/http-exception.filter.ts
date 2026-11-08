/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Bộ lọc bắt và chuẩn hóa toàn bộ Exception/lỗi trả về định dạng Unified API Error
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
    let errors: string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message
          ? Array.isArray(resObj.message)
            ? 'Dữ liệu đầu vào không hợp lệ'
            : resObj.message
          : exception.message;

        if (Array.isArray(resObj.message)) {
          errors = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      statusCode,
      message,
      errors,
      data: null,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
