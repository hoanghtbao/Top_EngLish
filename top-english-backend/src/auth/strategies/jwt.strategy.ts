/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Passport JWT Strategy giải mã và kiểm tra tính hợp lệ của Access Token
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'super_secret_jwt_key_top_english_2026_hoangbao',
      ),
    });
  }

  /**
   * Phương thức tự động gọi sau khi Passport xác thực chữ ký token thành công
   */
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc người dùng không tồn tại');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
    }

    return {
      _id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      streak: user.streak,
      totalXP: user.totalXP,
    };
  }
}
