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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
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

  @Get('sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách bộ đề Quiz, Lớp/Bài Từ vựng và Bài Ngữ pháp (chỉ Giáo viên & Admin)' })
  @ApiResponse({ status: 200, description: 'Nguồn dữ liệu tạo phòng Đấu trường' })
  async getCreatorSources() {
    const sources = await this.liveGameService.getCreatorSources();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nguồn câu hỏi Đấu trường thành công',
      data: sources,
    };
  }

  @Post('rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Khởi tạo phòng Đấu trường Leo Núi mới (chỉ Giáo viên & Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo phòng thành công' })
  async createRoom(
    @CurrentUser('userId') hostUserId: string,
    @Body()
    body?: {
      title?: string;
      sourceMode?: 'quiz' | 'custom';
      quizId?: string;
      topicIds?: string[];
      grammarLessonIds?: string[];
      vocabQuestionMode?: 'en_to_vi' | 'vi_to_en' | 'mixed_abcd';
      questionCount?: number;
      timePerQuestion?: number;
      shuffleQuestions?: boolean;
      shuffleOptions?: boolean;
    },
  ) {
    const room = await this.liveGameService.createRoom(hostUserId, {
      title: body?.title,
      sourceMode: body?.sourceMode || 'quiz',
      quizId: body?.quizId,
      topicIds: body?.topicIds,
      grammarLessonIds: body?.grammarLessonIds,
      vocabQuestionMode: body?.vocabQuestionMode,
      questionCount: body?.questionCount,
      timePerQuestion: body?.timePerQuestion || 15,
      shuffleQuestions: body?.shuffleQuestions ?? true,
      shuffleOptions: body?.shuffleOptions ?? true,
    });

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Khởi tạo phòng đấu trường thành công',
      data: {
        pin: room.pin,
        title: room.title,
        quizId: room.quizId,
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
