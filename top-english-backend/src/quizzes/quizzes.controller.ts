/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp API tra cứu đề thi, câu hỏi trắc nghiệm, nộp bài chấm điểm và lịch sử thi
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
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType } from './enums/quiz-type.enum';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Quizzes - Bài tập & Kiểm tra')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các đề kiểm tra (Có hỗ trợ lọc theo loại, cấp độ, chủ đề)' })
  @ApiQuery({ name: 'type', enum: QuizType, required: false, description: 'Loại bài kiểm tra (vocabulary, grammar, general)' })
  @ApiQuery({ name: 'level', enum: EnglishLevel, required: false, description: 'Cấp độ CEFR (A1 - C2)' })
  @ApiQuery({ name: 'topicId', type: String, required: false, description: 'Lọc theo ID chủ đề từ vựng' })
  @ApiQuery({ name: 'grammarLessonId', type: String, required: false, description: 'Lọc theo ID bài học ngữ pháp' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Từ khóa tìm kiếm tiêu đề' })
  @ApiResponse({ status: 200, description: 'Danh sách đề kiểm tra' })
  async findAll(
    @Query('type') type?: QuizType,
    @Query('level') level?: EnglishLevel,
    @Query('topicId') topicId?: string,
    @Query('grammarLessonId') grammarLessonId?: string,
    @Query('search') search?: string,
  ) {
    return this.quizzesService.findAll({ type, level, topicId, grammarLessonId, search });
  }

  @Get('my-submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy lịch sử làm bài kiểm tra của học viên hiện tại' })
  @ApiQuery({ name: 'quizId', type: String, required: false, description: 'Lọc theo ID đề thi cụ thể' })
  @ApiResponse({ status: 200, description: 'Danh sách kết quả các lần làm bài' })
  async getMySubmissions(
    @CurrentUser('userId') userId: string,
    @Query('quizId') quizId?: string,
  ) {
    return this.quizzesService.getUserSubmissions(userId, quizId);
  }

  @Get('submissions/:submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xem chi tiết kết quả một bài nộp cụ thể (Bao gồm đáp án và lời giải)' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài nộp đã chấm điểm' })
  async getSubmissionDetail(
    @Param('submissionId') submissionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.quizzesService.getSubmissionDetail(submissionId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem thông tin chi tiết một đề kiểm tra' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết đề kiểm tra' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đề kiểm tra' })
  async findOne(@Param('id') id: string) {
    return this.quizzesService.findById(id);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi để làm bài (ẨN đáp án đúng để chống gian lận)' })
  @ApiResponse({ status: 200, description: 'Danh sách câu hỏi làm bài' })
  async getQuestions(@Param('id') id: string) {
    return this.quizzesService.getQuestionsForQuiz(id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nộp bài kiểm tra, chấm điểm tự động và thưởng điểm kinh nghiệm XP' })
  @ApiResponse({ status: 200, description: 'Kết quả chấm điểm chi tiết' })
  async submitQuiz(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() submitQuizDto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(id, userId, submitQuizDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo đề kiểm tra mới (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Đề thi được tạo thành công' })
  async create(
    @Body() createQuizDto: CreateQuizDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.quizzesService.createQuiz(createQuizDto, userId);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm câu hỏi mới vào đề thi (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 201, description: 'Câu hỏi đã được thêm thành công' })
  async addQuestion(
    @Param('id') id: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.quizzesService.addQuestion(id, createQuestionDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật đề thi (Yêu cầu ADMIN hoặc TEACHER)' })
  @ApiResponse({ status: 200, description: 'Đề thi đã được cập nhật' })
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizzesService.updateQuiz(id, updateQuizDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa đề thi và các câu hỏi liên quan (Chỉ ADMIN)' })
  @ApiResponse({ status: 200, description: 'Đã xóa đề thi thành công' })
  async remove(@Param('id') id: string) {
    return this.quizzesService.removeQuiz(id);
  }
}
