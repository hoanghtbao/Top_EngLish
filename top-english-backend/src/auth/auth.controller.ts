/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller xử lý các yêu cầu HTTP liên quan đến xác thực và thông tin tài khoản
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleExchangeDto } from './dto/google-exchange.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Đăng ký tài khoản học viên mới
   */
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (vai trò mặc định: student)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công và nhận JWT tokens' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Đăng ký tài khoản thành công',
      data: result,
    };
  }

  /**
   * Đăng nhập tài khoản
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng Email và Mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Đăng nhập thành công',
      data: result,
    };
  }

  /**
   * Kiểm tra xem hệ thống đã cấu hình Google OAuth hay chưa
   */
  @Get('google/status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái tích hợp đăng nhập Google OAuth 2.0' })
  getGoogleStatus() {
    return {
      message: 'Lấy trạng thái Google OAuth thành công',
      data: this.authService.getGoogleStatus(),
    };
  }

  /**
   * Chuyển hướng người dùng sang trang xác thực chính thức của Google (OAuth 2.0 + PKCE + State)
   */
  @Get('google')
  @ApiOperation({ summary: 'Bắt đầu luồng đăng nhập / đăng ký qua Google OAuth 2.0' })
  startGoogleAuth(@Query('mode') mode: string | undefined, @Res() res: Response) {
    const { url, state, fallbackRedirect } = this.authService.initiateGoogleAuth(mode);
    if (!url || !state) {
      return res.redirect(fallbackRedirect || '/');
    }

    res.cookie('te_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth/google',
      maxAge: 5 * 60 * 1000,
    });

    return res.redirect(url);
  }

  /**
   * Callback nhận Authorization Code từ Google, xác minh chữ ký ID Token và chuyển về Frontend
   */
  @Get('google/callback')
  @ApiOperation({ summary: 'Xử lý callback từ Google OAuth 2.0' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const cookieHeader = req.headers.cookie || '';
    const cookieStateMatch = cookieHeader.match(/(?:^|;\s*)te_oauth_state=([^;]+)/);
    const cookieState = cookieStateMatch
      ? decodeURIComponent(cookieStateMatch[1])
      : undefined;

    res.clearCookie('te_oauth_state', { path: '/api/v1/auth/google' });

    const redirectUrl = await this.authService.handleGoogleCallback({
      code,
      state,
      error,
      cookieState,
    });

    return res.redirect(redirectUrl);
  }

  /**
   * Đổi one-time exchange code lấy JWT Access/Refresh Token qua POST body an toàn
   */
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mã xác thực Google một lần lấy cặp JWT tokens' })
  async exchangeGoogleCode(@Body() dto: GoogleExchangeDto) {
    const result = await this.authService.exchangeGoogleCode(dto.code);
    return {
      message: 'Xác thực Google thành công',
      data: result,
    };
  }

  /**
   * Cấp lại Access Token mới khi hết hạn
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token thông qua Refresh Token' })
  @ApiResponse({ status: 200, description: 'Cấp token mới thành công' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    return {
      message: 'Làm mới token thành công',
      data: tokens,
    };
  }

  /**
   * Đăng xuất và hủy phiên làm việc
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đăng xuất tài khoản và thu hồi Refresh Token' })
  async logout(@CurrentUser('_id') userId: string) {
    await this.authService.logout(userId);
    return {
      message: 'Đăng xuất thành công',
      data: null,
    };
  }

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản của người dùng đang đăng nhập' })
  async getMe(@CurrentUser('_id') userId: string) {
    const user = await this.authService.getMe(userId);
    return {
      message: 'Lấy thông tin tài khoản thành công',
      data: user,
    };
  }

  /**
   * Cập nhật thông tin cá nhân (họ tên, avatar)
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật họ tên hoặc ảnh đại diện' })
  async updateProfile(
    @CurrentUser('_id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);
    return {
      message: 'Cập nhật hồ sơ thành công',
      data: updatedUser,
    };
  }

  /**
   * Tải lên ảnh đại diện cá nhân (Dành cho Student, Teacher, Admin)
   */
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tải lên ảnh đại diện mới từ thiết bị (Student, Teacher, Admin)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = resolve(process.cwd(), 'uploads');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase() || '.png';
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận các định dạng ảnh hợp lệ (JPG, JPEG, PNG, WEBP, SVG, AVIF)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('_id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const avatarUrl = `${backendUrl}/uploads/${file.filename}`;

    const updatedUser = await this.usersService.updateProfile(userId, {
      avatar: avatarUrl,
    });

    return {
      message: 'Cập nhật ảnh đại diện thành công',
      data: {
        avatarUrl,
        user: updatedUser,
      },
    };
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đổi mật khẩu người dùng' })
  async changePassword(
    @CurrentUser('_id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(userId, changePasswordDto);
    return {
      message: result.message,
      data: null,
    };
  }
}
