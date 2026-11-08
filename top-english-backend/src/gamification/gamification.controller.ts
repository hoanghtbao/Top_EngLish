/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API Bảng xếp hạng toàn hệ thống, Đua top và Hệ thống Huy hiệu Gamification
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
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
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gamification - Bảng Xếp Hạng & Huy Hiệu')
@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('leaderboard')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Lấy Bảng xếp hạng người học toàn hệ thống (Tuần, Tháng, Mọi thời đại)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['all-time', 'weekly', 'monthly'],
    description: 'Khung thời gian xếp hạng (mặc định: all-time)',
  })
  @ApiResponse({ status: 200, description: 'Bảng xếp hạng toàn hệ thống' })
  async getLeaderboard(
    @Query('period') period: 'all-time' | 'weekly' | 'monthly' = 'all-time',
    @CurrentUser('userId') currentUserId?: string,
  ) {
    const data = await this.gamificationService.getLeaderboard(
      period,
      currentUserId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy bảng xếp hạng thành công',
      data,
    };
  }

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Lấy danh sách Huy hiệu & Tiến độ mở khóa thành tựu của học viên',
  })
  @ApiResponse({ status: 200, description: 'Danh sách huy hiệu và tiến độ' })
  async getAchievements(@CurrentUser('userId') userId: string) {
    const data = await this.gamificationService.getUserAchievements(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách thành tựu thành công',
      data,
    };
  }

  @Get('streak')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy trạng thái chuỗi Streak thời gian thực & Lịch học 7 ngày chuẩn Duolingo',
  })
  @ApiResponse({ status: 200, description: 'Trạng thái chuỗi streak thời gian thực' })
  async getStreak(@CurrentUser('userId') userId: string) {
    const data = await this.gamificationService.getStreakStatus(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin chuỗi streak thành công',
      data,
    };
  }

  @Post('streak/record')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Ghi nhận hoàn thành hoạt động học và cập nhật chuỗi Streak chuẩn Duolingo',
  })
  @ApiResponse({ status: 200, description: 'Kết quả cập nhật streak và XP' })
  async recordStreak(
    @CurrentUser('userId') userId: string,
    @Body('xpEarned') xpEarned: number = 0,
  ) {
    const data = await this.gamificationService.recordStreakActivity(userId, xpEarned);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cập nhật chuỗi streak thành công',
      data,
    };
  }
}
