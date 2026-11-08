/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ xác thực (đăng ký, đăng nhập, token rotation, băm mật khẩu bcrypt)
 */

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Đăng ký tài khoản người dùng mới
   * Mật khẩu được băm bằng bcrypt với độ phức tạp salt = 10
   */
  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký trong hệ thống');
    }

    // 2. Băm mật khẩu với bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Tạo tài khoản trong cơ sở dữ liệu
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      fullName,
    });

    // 4. Khởi tạo cặp token xác thực
    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    // 5. Lưu trữ bản băm của Refresh Token để quản lý phiên và thu hồi khi logout
    await this.updateHashedRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        streak: user.streak,
        totalXP: user.totalXP,
      },
      tokens,
    };
  }

  /**
   * Đăng nhập hệ thống bằng email và mật khẩu
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Tìm tài khoản theo email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra trạng thái kích hoạt tài khoản
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    // 3. So khớp mật khẩu đã băm bằng bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 4. Tạo cặp token mới
    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    // 5. Cập nhật bản băm của Refresh Token vào Database
    await this.updateHashedRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        streak: user.streak,
        totalXP: user.totalXP,
      },
      tokens,
    };
  }

  /**
   * Cấp lại Access Token mới bằng Refresh Token (Token Rotation)
   */
  async refreshTokens(refreshToken: string) {
    try {
      // 1. Giải mã và kiểm tra chữ ký của Refresh Token
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super_secret_refresh_jwt_key_top_english_2026_hoangbao',
      );

      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      // 2. Tìm người dùng tương ứng
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ');
      }

      // 3. So sánh Refresh Token gửi lên với chuỗi băm lưu trong cơ sở dữ liệu
      const isTokenMatching = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!isTokenMatching) {
        throw new UnauthorizedException('Refresh Token không hợp lệ');
      }

      // 4. Sinh cặp token mới (Token Rotation an toàn)
      const newTokens = await this.generateTokens(user._id.toString(), user.email, user.role);

      // 5. Cập nhật lại hash của Refresh Token mới
      await this.updateHashedRefreshToken(user._id.toString(), newTokens.refreshToken);

      return newTokens;
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Đăng xuất người dùng: xóa hashedRefreshToken trong database để vô hiệu hóa phiên
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Lấy thông tin tài khoản hiện tại của người dùng đang đăng nhập
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      streak: user.streak,
      lastActiveDate: user.lastActiveDate,
      totalXP: user.totalXP,
      createdAt: (user as any).createdAt,
    };
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    // 1. Kiểm tra mật khẩu cũ
    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // 2. Băm và lưu mật khẩu mới
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, newHashedPassword);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Hàm tiện ích: Sinh cặp Access Token (ngắn hạn: 15m) & Refresh Token (dài hạn: 7d)
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'super_secret_jwt_key_top_english_2026_hoangbao',
        ),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'super_secret_refresh_jwt_key_top_english_2026_hoangbao',
        ),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hàm tiện ích: Băm Refresh Token trước khi lưu vào cơ sở dữ liệu
   */
  private async updateHashedRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashed);
  }
}
