/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Interceptor chuẩn hóa định dạng dữ liệu trả về cho toàn bộ API
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((result) => {
        // Nếu kết quả trả về đã tự cấu trúc message/data
        if (result && typeof result === 'object' && 'data' in result) {
          return {
            success: true,
            statusCode,
            message: result.message || 'Thành công',
            data: result.data,
            pagination: result.pagination,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Thành công',
          data: result ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
