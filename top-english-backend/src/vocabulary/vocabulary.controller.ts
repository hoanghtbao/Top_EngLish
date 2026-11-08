/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API tra cứu và quản lý thẻ từ vựng (Vocabularies)
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
import { VocabularyService } from './vocabulary.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Vocabularies - Thẻ từ vựng')
@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('topic/:topicId')
  @ApiOperation({ summary: 'Lấy danh sách từ vựng thuộc về một chủ đề (có hỗ trợ tìm kiếm)' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Từ khóa tìm kiếm theo từ hoặc nghĩa tiếng Việt' })
  @ApiResponse({ status: 200, description: 'Danh sách thẻ từ vựng của chủ đề' })
  async findByTopic(
    @Param('topicId') topicId: string,
    @Query('search') search?: string,
  ) {
    return this.vocabularyService.findByTopic(topicId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem thông tin chi tiết một từ vựng' })
  @ApiResponse({ status: 200, description: 'Chi tiết thẻ từ vựng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy từ vựng' })
  async findOne(@Param('id') id: string) {
    return this.vocabularyService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm từ vựng mới vào chủ đề (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Từ vựng đã được tạo thành công' })
  async create(
    @Body() createVocabularyDto: CreateVocabularyDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.vocabularyService.create(createVocabularyDto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật từ vựng (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Từ vựng đã được cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() updateVocabularyDto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(id, updateVocabularyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa thẻ từ vựng (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Đã xóa thẻ từ vựng' })
  async remove(@Param('id') id: string) {
    return this.vocabularyService.remove(id);
  }
}
