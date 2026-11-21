/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API quản lý Lớp học từ vựng (VocabClasses) và Bài học (Topics)
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
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateVocabClassDto } from './dto/create-vocab-class.dto';
import { UpdateVocabClassDto } from './dto/update-vocab-class.dto';
import { EnglishLevel } from './enums/english-level.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Topics - Lớp học & Bài học từ vựng')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  // =========================================================================
  // QUẢN LÝ LỚP HỌC TỪ VỰNG (VOCAB CLASSES)
  // =========================================================================

  @Get('classes')
  @ApiOperation({ summary: 'Lấy danh sách các lớp học từ vựng (kèm tổng số bài học và số từ)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Tìm kiếm theo tên, mã lớp hoặc mô tả' })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học được trả về thành công' })
  async findAllClasses(@Query('search') search?: string) {
    return this.topicsService.findAllClasses(search);
  }

  @Get('classes/:idOrCode')
  @ApiOperation({ summary: 'Xem chi tiết một lớp học kèm danh sách bài học bên trong' })
  @ApiResponse({ status: 200, description: 'Thông tin lớp học và danh sách bài học' })
  async findOneClass(@Param('idOrCode') idOrCode: string) {
    return this.topicsService.findClassWithLessons(idOrCode);
  }

  @Post('classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lớp học từ vựng mới (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Lớp học đã được tạo thành công' })
  async createClass(
    @Body() dto: CreateVocabClassDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.topicsService.createClass(dto, userId);
  }

  @Patch('classes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin lớp học (Yêu cầu ADMIN hoặc TEACHER)' })
  async updateClass(
    @Param('id') id: string,
    @Body() dto: UpdateVocabClassDto,
  ) {
    return this.topicsService.updateClass(id, dto);
  }

  @Delete('classes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa lớp học từ vựng và các bài học thuộc lớp (Yêu cầu ADMIN hoặc TEACHER)' })
  async removeClass(@Param('id') id: string) {
    return this.topicsService.removeClass(id);
  }

  // =========================================================================
  // QUẢN LÝ BÀI HỌC TỪ VỰNG (LESSONS / TOPICS)
  // =========================================================================

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bài học từ vựng (Có lọc theo lớp học, trình độ và tìm kiếm)' })
  @ApiQuery({ name: 'vocabClassId', type: String, required: false, description: 'Lọc bài học theo ID lớp học' })
  @ApiQuery({ name: 'level', enum: EnglishLevel, required: false, description: 'Trình độ tiếng Anh CEFR (A1 - C2)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Từ khóa tìm kiếm tiêu đề, tag hoặc mô tả' })
  @ApiResponse({ status: 200, description: 'Danh sách bài học được trả về thành công' })
  async findAll(
    @Query('vocabClassId') vocabClassId?: string,
    @Query('level') level?: EnglishLevel,
    @Query('search') search?: string,
  ) {
    return this.topicsService.findAll({ vocabClassId, level, search });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một bài học theo ID hoặc Slug' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết bài học' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.topicsService.findByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bài học từ vựng mới (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Bài học đã được tạo thành công' })
  async create(
    @Body() createTopicDto: CreateTopicDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.topicsService.create(createTopicDto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật thông tin bài học (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Bài học đã được cập nhật' })
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa bài học từ vựng (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Đã xóa bài học thành công' })
  async remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
