/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API quản lý danh mục và chủ đề học từ vựng
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
import { EnglishLevel } from './enums/english-level.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Topics - Chủ đề từ vựng')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các chủ đề từ vựng (Có lọc theo trình độ và tìm kiếm)' })
  @ApiQuery({ name: 'level', enum: EnglishLevel, required: false, description: 'Trình độ tiếng Anh (A1, A2, B1, B2, C1, C2)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Từ khóa tìm kiếm tiêu đề hoặc mô tả' })
  @ApiResponse({ status: 200, description: 'Danh sách chủ đề được trả về thành công' })
  async findAll(
    @Query('level') level?: EnglishLevel,
    @Query('search') search?: string,
  ) {
    return this.topicsService.findAll({ level, search });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một chủ đề theo ID hoặc Slug' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết chủ đề' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.topicsService.findByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo chủ đề học mới (Yêu cầu quyền ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Chủ đề đã được tạo thành công' })
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
  @ApiOperation({ summary: 'Cập nhật thông tin chủ đề (Yêu cầu quyền ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Chủ đề đã được cập nhật' })
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa chủ đề học (Chỉ ADMIN)' })
  @ApiResponse({ status: 200, description: 'Đã xóa chủ đề thành công' })
  async remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
