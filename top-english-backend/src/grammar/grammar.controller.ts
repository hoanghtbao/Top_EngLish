/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API tra cứu, quản lý bài học ngữ pháp và theo dõi tiến độ học viên
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GrammarService } from './grammar.service';
import { CreateGrammarLessonDto } from './dto/create-grammar-lesson.dto';
import { UpdateGrammarLessonDto } from './dto/update-grammar-lesson.dto';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Grammar - Ngữ pháp tiếng Anh')
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách các chuyên mục ngữ pháp và số lượng bài' })
  @ApiResponse({ status: 200, description: 'Danh sách chuyên mục kèm số lượng' })
  async getCategories() {
    return this.grammarService.getCategories();
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy tổng quan tiến độ học ngữ pháp của học viên hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin tiến độ (% hoàn thành, số bài đã học)' })
  async getUserProgress(@CurrentUser('userId') userId: string) {
    return this.grammarService.getUserProgress(userId);
  }

  @Post('progress/:lessonId/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu hoặc hủy đánh dấu hoàn thành bài học (Thưởng 20 XP khi hoàn thành)' })
  @ApiResponse({ status: 200, description: 'Trạng thái hoàn thành được cập nhật' })
  async toggleProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.grammarService.toggleProgress(lessonId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học ngữ pháp (Có lọc theo trình độ, chuyên mục và tìm kiếm)' })
  @ApiQuery({ name: 'level', enum: EnglishLevel, required: false, description: 'Trình độ CEFR (A1 - C2)' })
  @ApiQuery({ name: 'category', type: String, required: false, description: 'Chuyên mục (Tenses, Conditionals...)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Từ khóa tìm kiếm tiêu đề hoặc tóm tắt' })
  @ApiResponse({ status: 200, description: 'Danh sách bài học ngữ pháp' })
  async findAll(
    @Query('level') level?: EnglishLevel,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.grammarService.findAll({ level, category, search });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Xem chi tiết bài học ngữ pháp theo ID hoặc Slug' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết bài học ngữ pháp' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.grammarService.findByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bài học ngữ pháp mới (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Bài học đã được tạo thành công' })
  async create(
    @Body() createGrammarLessonDto: CreateGrammarLessonDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.grammarService.create(createGrammarLessonDto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật bài học ngữ pháp (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Bài học đã được cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateGrammarLessonDto: UpdateGrammarLessonDto,
  ) {
    return this.grammarService.update(id, updateGrammarLessonDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa bài học ngữ pháp (Chỉ ADMIN)' })
  @ApiResponse({ status: 200, description: 'Đã xóa bài học ngữ pháp' })
  async remove(@Param('id') id: string) {
    return this.grammarService.remove(id);
  }
}
