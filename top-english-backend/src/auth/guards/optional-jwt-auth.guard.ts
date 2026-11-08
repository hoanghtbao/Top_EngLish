/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Guard cho phép cả khách vãng lai và người dùng đăng nhập truy cập (Optional JWT)
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Nếu có lỗi hoặc không có token, không ném ngoại lệ mà trả về null
    return user || null;
  }
}
