/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller điều phối API Bảng Quản Trị Hệ Thống & Giám Sát Học Liệu dành riêng cho Admin
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../users/enums/role.enum';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from '../users/dto/update-role.dto';
import { UpdateStatusDto } from '../users/dto/update-status.dto';
import { UpdateHomepageHeroDto } from './dto/homepage-settings.dto';

@ApiTags('Admin Dashboard & Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Lấy số liệu thống kê toàn hệ thống (Users, Content, Engagement, Server health)
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Lấy số liệu thống kê & KPI tổng quan hệ thống (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy số liệu thống kê thành công',
  })
  async getStats() {
    const stats = await this.adminService.getSystemStats();
    return {
      message: 'Lấy thống kê hệ thống thành công',
      data: stats,
    };
  }

  /**
   * Lấy danh sách người dùng chuyên sâu có tìm kiếm, lọc theo vai trò, trạng thái và phân trang
   */
  @Get('users')
  @ApiOperation({
    summary: 'Danh sách người dùng có tìm kiếm và bộ lọc (Admin)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('status') status?: 'active' | 'inactive',
  ) {
    const result = await this.adminService.getUsersList(
      +page,
      +limit,
      search,
      role,
      status,
    );
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: result.users,
      pagination: result.pagination,
    };
  }

  /**
   * Cập nhật vai trò (Role) người dùng (Nâng cấp Student -> Teacher / Admin)
   */
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò người dùng (Admin)' })
  async updateRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const updated = await this.adminService.updateUserRole(
      userId,
      updateRoleDto.role,
    );
    return {
      message: 'Cập nhật vai trò người dùng thành công',
      data: updated,
    };
  }

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản (Admin)' })
  async updateStatus(
    @Param('id') userId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser('_id') adminId: string,
  ) {
    const updated = await this.adminService.updateUserStatus(
      userId,
      updateStatusDto.isActive,
      adminId,
    );
    return {
      message: updateStatusDto.isActive
        ? 'Mở khóa tài khoản thành công'
        : 'Đã khóa tài khoản thành công',
      data: updated,
    };
  }

  /**
   * Xóa tài khoản người dùng
   */
  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa vĩnh viễn tài khoản người dùng (Admin)' })
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('_id') adminId: string,
  ) {
    const result = await this.adminService.deleteUser(userId, adminId);
    return {
      message: 'Xóa tài khoản người dùng thành công',
      data: result,
    };
  }

  /**
   * Cập nhật URL ảnh đại diện cho bất kỳ người dùng nào (Admin)
   */
  @Patch('users/:id/avatar')
  @ApiOperation({
    summary: 'Cập nhật ảnh đại diện của người dùng (Admin)',
  })
  async updateUserAvatar(
    @Param('id') userId: string,
    @Body('avatar') avatar: string,
  ) {
    const updated = await this.adminService.updateUserAvatar(userId, avatar);
    return {
      message: 'Cập nhật ảnh đại diện thành công',
      data: updated,
    };
  }

  /**
   * Tải lên ảnh đại diện cho bất kỳ người dùng nào (Admin)
   */
  @Post('users/:id/avatar')
  @ApiOperation({
    summary: 'Tải lên ảnh đại diện từ thiết bị cho người dùng (Admin)',
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
  async uploadUserAvatar(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const avatarUrl = `${backendUrl}/uploads/${file.filename}`;

    const updatedUser = await this.adminService.updateUserAvatar(
      userId,
      avatarUrl,
    );

    return {
      message: 'Cập nhật ảnh đại diện cho người dùng thành công',
      data: {
        avatarUrl,
        user: updatedUser,
      },
    };
  }

  /**
   * Giám sát học liệu toàn hệ thống
   */
  @Get('content/summary')
  @ApiOperation({
    summary: 'Giám sát tổng quan học liệu & lớp học toàn hệ thống (Admin)',
  })
  async getContentSummary() {
    const summary = await this.adminService.getContentSummary();
    return {
      message: 'Lấy dữ liệu giám sát học liệu thành công',
      data: summary,
    };
  }

  /**
   * Lấy cấu hình ảnh nền Hero trang chủ (Admin)
   */
  @Get('settings/homepage')
  @ApiOperation({ summary: 'Lấy cấu hình ảnh nền Hero trang chủ (Admin)' })
  async getHomepageSettings() {
    const data = await this.adminService.getHomepageSettings();
    return {
      message: 'Lấy cấu hình trang chủ thành công',
      data,
    };
  }

  /**
   * Cập nhật cấu hình ảnh nền Hero trang chủ (Admin)
   */
  @Patch('settings/homepage')
  @ApiOperation({ summary: 'Cập nhật cấu hình ảnh nền Hero trang chủ (Admin)' })
  async updateHomepageSettings(
    @Body() dto: UpdateHomepageHeroDto,
    @CurrentUser('_id') adminId: string,
  ) {
    const data = await this.adminService.updateHomepageSettings(dto, adminId);
    return {
      message: 'Cập nhật ảnh nền trang chủ thành công',
      data,
    };
  }

  /**
   * Tải lên ảnh nền Hero trang chủ từ thiết bị (Admin)
   */
  @Post('upload/hero-bg')
  @ApiOperation({ summary: 'Tải lên ảnh nền Hero trang chủ từ thiết bị (Admin)' })
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
          cb(null, `hero-bg-${uniqueSuffix}${ext}`);
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
  async uploadHeroBackground(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const relativeUrl = `/uploads/${file.filename}`;
    const fullUrl = `${backendUrl}${relativeUrl}`;

    return {
      message: 'Tải lên ảnh nền thành công',
      data: {
        filename: file.filename,
        url: fullUrl,
        relativeUrl,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  }
}
