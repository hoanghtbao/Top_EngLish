/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller quản trị người dùng dành cho Quản trị viên (Admin)
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from './enums/role.enum';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Admin Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lấy danh sách toàn bộ người dùng có phân trang và lọc theo vai trò
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Chỉ dành cho Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('role') role?: Role,
  ) {
    const result = await this.usersService.findAll(+page, +limit, role);
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: result.users,
      pagination: result.pagination,
    };
  }

  /**
   * Thay đổi vai trò người dùng (Ví dụ: nâng cấp Student thành Teacher)
   */
  @Patch(':id/role')
  @ApiOperation({ summary: 'Cập nhật vai trò người dùng (Chỉ dành cho Admin)' })
  async updateRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const updatedUser = await this.usersService.updateRole(userId, updateRoleDto.role);
    return {
      message: 'Cập nhật vai trò thành công',
      data: updatedUser,
    };
  }

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Khóa hoặc kích hoạt tài khoản (Chỉ dành cho Admin)' })
  async updateStatus(
    @Param('id') userId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser('_id') adminId: string,
  ) {
    // Ngăn chặn admin tự khóa tài khoản của chính mình
    if (userId === adminId && !updateStatusDto.isActive) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình');
    }

    const updatedUser = await this.usersService.updateStatus(
      userId,
      updateStatusDto.isActive,
    );
    return {
      message: updateStatusDto.isActive
        ? 'Mở khóa tài khoản thành công'
        : 'Đã khóa tài khoản thành công',
      data: updatedUser,
    };
  }
}
