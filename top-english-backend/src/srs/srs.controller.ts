/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API thuật toán lặp lại ngắt quãng SRS và Dashboard tiến độ học tập
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SrsService } from './srs.service';
import { ReviewWordDto } from './dto/review-word.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('SRS - Lặp lại ngắt quãng & Tiến độ học tập')
@Controller('srs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SrsController {
  constructor(private readonly srsService: SrsService) {}

  @Post('review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ghi nhận kết quả đánh giá thẻ từ vựng theo thuật toán lặp lại ngắt quãng (SRS)' })
  @ApiResponse({ status: 200, description: 'Cập nhật chu kỳ lặp lại và thưởng điểm XP thành công' })
  async recordReview(
    @CurrentUser('userId') userId: string,
    @Body() dto: ReviewWordDto,
  ) {
    return this.srsService.recordReview(userId, dto);
  }

  @Get('due-words')
  @ApiOperation({ summary: 'Lấy danh sách các từ vựng đến hạn cần ôn tập hôm nay' })
  @ApiResponse({ status: 200, description: 'Danh sách thẻ từ vựng cần ôn tập' })
  async getDueWords(@CurrentUser('userId') userId: string) {
    return this.srsService.getDueWords(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê phân bổ trí nhớ SRS (Learning, Reviewing, Mastered)' })
  @ApiResponse({ status: 200, description: 'Số liệu phân bổ trí nhớ' })
  async getSrsStats(@CurrentUser('userId') userId: string) {
    return this.srsService.getSrsStats(userId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy toàn bộ số liệu tổng quan tiến độ học tập (Dashboard) của học viên' })
  @ApiResponse({ status: 200, description: 'Thông tin tiến độ toàn diện (Từ vựng, Ngữ pháp, Bài thi, XP, Streak)' })
  async getUserDashboard(@CurrentUser('userId') userId: string) {
    return this.srsService.getUserDashboard(userId);
  }
}
