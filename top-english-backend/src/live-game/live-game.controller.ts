/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API REST khởi tạo phòng và tra cứu thông tin Đấu Trường Leo Núi
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CLIMBING_CHARACTERS, LiveGameService } from './live-game.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Live Game - Đấu Trường Leo Núi')
@Controller('live-game')
export class LiveGameController {
  constructor(private readonly liveGameService: LiveGameService) {}

  @Get('characters')
  @ApiOperation({ summary: 'Lấy danh sách 8 nhân vật leo núi dễ thương' })
  getCharacters() {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nhân vật thành công',
      data: CLIMBING_CHARACTERS,
    };
  }

  @Post('rooms')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Khởi tạo phòng Đấu trường Leo Núi mới và nhận mã PIN 6 số' })
  @ApiResponse({ status: 201, description: 'Tạo phòng thành công' })
  async createRoom(
    @CurrentUser('userId') hostUserId?: string,
    @Body()
    body?: {
      title?: string;
      quizId?: string;
      timePerQuestion?: number;
    },
  ) {
    const hostId = hostUserId || `host_${Date.now()}`;
    const room = await this.liveGameService.createRoom(
      hostId,
      body?.title,
      body?.quizId,
      body?.timePerQuestion || 15,
    );

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Khởi tạo phòng đấu trường thành công',
      data: {
        pin: room.pin,
        title: room.title,
        status: room.status,
        totalQuestions: room.questions.length,
        timePerQuestion: room.timePerQuestion,
        characters: CLIMBING_CHARACTERS,
      },
    };
  }

  @Get('rooms/:pin')
  @ApiOperation({ summary: 'Kiểm tra mã PIN phòng đấu trường và lấy thông tin cơ bản' })
  @ApiResponse({ status: 200, description: 'Thông tin phòng' })
  getRoomByPin(@Param('pin') pin: string) {
    const room = this.liveGameService.getRoom(pin);
    if (!room) {
      throw new NotFoundException(`Mã PIN "${pin}" không tồn tại hoặc phòng đã bị đóng`);
    }

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Mã PIN hợp lệ',
      data: {
        pin: room.pin,
        title: room.title,
        status: room.status,
        playerCount: room.players.size,
        totalQuestions: room.questions.length,
        timePerQuestion: room.timePerQuestion,
        characters: CLIMBING_CHARACTERS,
      },
    };
  }
}
