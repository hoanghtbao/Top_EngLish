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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
