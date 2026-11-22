/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ xác thực (đăng ký, đăng nhập, token rotation, băm mật khẩu bcrypt)
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface PendingOAuthState {
  codeVerifier: string;
  mode: 'login' | 'register';
  expiresAt: number;
}

interface PendingExchangeCode {
  userId: string;
  isNewUser: boolean;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pendingOAuthStates = new Map<string, PendingOAuthState>();
  private readonly pendingExchangeCodes = new Map<string, PendingExchangeCode>();

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
      user: this.formatUserResponse(user),
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

    // 3. Nếu tài khoản chỉ đăng nhập Google và chưa có mật khẩu cục bộ
    if (!user.password) {
      throw new UnauthorizedException(
        'Tài khoản này được bảo vệ qua Google. Vui lòng nhấn "Tiếp tục với Google" để đăng nhập',
      );
    }

    // 4. So khớp mật khẩu đã băm bằng bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 5. Tạo cặp token mới
    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    // 6. Cập nhật bản băm của Refresh Token vào Database
    await this.updateHashedRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.formatUserResponse(user),
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
      ...this.formatUserResponse(user),
      lastActiveDate: user.lastActiveDate,
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

    if (!user.password) {
      throw new BadRequestException(
        'Tài khoản đăng nhập bằng Google không sử dụng mật khẩu cục bộ',
      );
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
   * Kiểm tra trạng thái cấu hình Google OAuth trên máy chủ
   */
  getGoogleStatus() {
    const { clientId, clientSecret, callbackUrl } = this.getGoogleOAuthConfig();
    return {
      configured: Boolean(clientId && clientSecret),
      callbackUrl,
    };
  }

  /**
   * Khởi tạo phiên Google OAuth 2.0 với State (chống CSRF) và PKCE (S256)
   */
  initiateGoogleAuth(modeParam?: string) {
    const mode: 'login' | 'register' = modeParam === 'register' ? 'register' : 'login';
    const { clientId, clientSecret, callbackUrl, frontendUrl } = this.getGoogleOAuthConfig();

    if (!clientId || !clientSecret) {
      return {
        url: null,
        state: null,
        fallbackRedirect: `${frontendUrl}/${mode}?googleError=not_configured`,
      };
    }

    this.pruneExpiredOAuthEntries();

    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    this.pendingOAuthStates.set(state, {
      codeVerifier,
      mode,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const oauthClient = new OAuth2Client(clientId, clientSecret, callbackUrl);
    const url = oauthClient.generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });

    return { url, state, fallbackRedirect: null };
  }

  /**
   * Xử lý callback từ Google, xác minh ID Token bằng chữ ký số của Google,
   * liên kết/tạo người dùng và phát hành one-time exchange code chuyển về Frontend
   */
  async handleGoogleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
    cookieState?: string;
  }): Promise<string> {
    const { clientId, clientSecret, callbackUrl, frontendUrl } = this.getGoogleOAuthConfig();
    const pending = params.state ? this.pendingOAuthStates.get(params.state) : undefined;
    const mode: 'login' | 'register' = pending?.mode || 'login';

    if (params.state) {
      this.pendingOAuthStates.delete(params.state);
    }

    if (params.error) {
      const code = params.error === 'access_denied' ? 'access_denied' : 'oauth_failed';
      return `${frontendUrl}/${mode}?googleError=${code}`;
    }

    if (!clientId || !clientSecret) {
      return `${frontendUrl}/${mode}?googleError=not_configured`;
    }

    if (
      !params.code ||
      !params.state ||
      !pending ||
      pending.expiresAt <= Date.now() ||
      !params.cookieState ||
      params.cookieState !== params.state
    ) {
      return `${frontendUrl}/${mode}?googleError=invalid_state`;
    }

    try {
      const oauthClient = new OAuth2Client(clientId, clientSecret, callbackUrl);
      const { tokens } = await oauthClient.getToken({
        code: params.code,
        codeVerifier: pending.codeVerifier,
      });

      if (!tokens.id_token) {
        return `${frontendUrl}/${mode}?googleError=missing_id_token`;
      }

      const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
        return `${frontendUrl}/${mode}?googleError=unverified_email`;
      }

      const { user, isNewUser } = await this.findOrCreateGoogleUser({
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name || payload.email.split('@')[0],
        avatar: payload.picture || null,
      });

      if (!user.isActive) {
        return `${frontendUrl}/${mode}?googleError=account_disabled`;
      }

      this.pruneExpiredOAuthEntries();
      const exchangeCode = crypto.randomBytes(32).toString('hex');
      this.pendingExchangeCodes.set(exchangeCode, {
        userId: user._id.toString(),
        isNewUser,
        expiresAt: Date.now() + 60 * 1000,
      });

      return `${frontendUrl}/auth/google/callback?code=${exchangeCode}`;
    } catch (err) {
      this.logger.warn(`Google OAuth callback error: ${(err as Error).message}`);
      return `${frontendUrl}/${mode}?googleError=oauth_failed`;
    }
  }

  /**
   * Đổi one-time exchange code lấy cặp JWT Access/Refresh Token qua kênh POST an toàn
   */
  async exchangeGoogleCode(code: string) {
    const pending = this.pendingExchangeCodes.get(code);
    this.pendingExchangeCodes.delete(code);

    if (!pending || pending.expiresAt <= Date.now()) {
      throw new UnauthorizedException('Phiên xác thực Google đã hết hạn hoặc không hợp lệ');
    }

    const user = await this.usersService.findById(pending.userId);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
    await this.updateHashedRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.formatUserResponse(user),
      isNewUser: pending.isNewUser,
      tokens,
    };
  }

  /**
   * Tìm theo googleId hoặc email đã xác thực để liên kết, nếu chưa có sẽ tự tạo tài khoản mới
   */
  private async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatar: string | null;
  }): Promise<{ user: UserDocument; isNewUser: boolean }> {
    const normalizedEmail = profile.email.toLowerCase().trim();

    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (user) {
      return { user, isNewUser: false };
    }

    user = await this.usersService.findByEmail(normalizedEmail);
    if (user) {
      const linked = await this.usersService.linkGoogleAccount(user._id, {
        googleId: profile.googleId,
        avatar: user.avatar ? undefined : profile.avatar,
      });
      return { user: linked || user, isNewUser: false };
    }

    const newUser = await this.usersService.create({
      email: normalizedEmail,
      fullName: profile.fullName.trim() || normalizedEmail.split('@')[0],
      avatar: profile.avatar || undefined,
      googleId: profile.googleId,
      authProvider: 'google',
      emailVerified: true,
      isActive: true,
    });

    return { user: newUser, isNewUser: true };
  }

  private getGoogleOAuthConfig() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '').trim();
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET', '').trim();
    const port = this.configService.get<string>('PORT', '5001');
    const callbackUrl =
      this.configService.get<string>('GOOGLE_CALLBACK_URL', '').trim() ||
      `http://localhost:${port}/api/v1/auth/google/callback`;
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').trim() ||
      'http://localhost:3000';

    return { clientId, clientSecret, callbackUrl, frontendUrl };
  }

  private pruneExpiredOAuthEntries() {
    const now = Date.now();
    for (const [key, value] of this.pendingOAuthStates.entries()) {
      if (value.expiresAt <= now) {
        this.pendingOAuthStates.delete(key);
      }
    }
    for (const [key, value] of this.pendingExchangeCodes.entries()) {
      if (value.expiresAt <= now) {
        this.pendingExchangeCodes.delete(key);
      }
    }
  }

  private formatUserResponse(user: UserDocument) {
    return {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      streak: user.streak,
      totalXP: user.totalXP,
      authProvider: user.authProvider || 'local',
      emailVerified: Boolean(user.emailVerified),
    };
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
