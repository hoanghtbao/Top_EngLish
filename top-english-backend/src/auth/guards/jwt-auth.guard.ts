/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Guard bảo vệ API yêu cầu xác thực JWT Bearer Token
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Vui lòng đăng nhập để thực hiện chức năng này',
        )
      );
    }
    return user;
  }
}
