/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp các REST API cho lớp học trực tuyến, bài tập, nộp bài, chấm điểm và sổ điểm
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Classrooms - Lớp học trực tuyến & Bài tập')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post('classrooms')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên/Admin tạo lớp học mới và nhận mã tham gia tự động' })
  @ApiResponse({ status: 201, description: 'Tạo lớp học thành công' })
  async createClassroom(
    @CurrentUser('userId') teacherId: string,
    @Body() dto: CreateClassroomDto,
  ) {
    const classroom = await this.classroomsService.createClassroom(
      teacherId,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Khởi tạo lớp học mới thành công',
      data: classroom,
    };
  }

  @Get('classrooms')
  @ApiOperation({ summary: 'Lấy danh sách các lớp học của người dùng (Teacher: lớp quản lý, Student: lớp tham gia)' })
  @ApiResponse({ status: 200, description: 'Danh sách lớp học' })
  async getMyClassrooms(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    const classrooms = await this.classroomsService.findAllForUser(
      userId,
      role,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lớp học thành công',
      data: classrooms,
    };
  }

  @Post('classrooms/join')
  @ApiOperation({ summary: 'Học viên tham gia lớp học bằng mã mời (e.g. TOP-XXXX)' })
  @ApiResponse({ status: 200, description: 'Tham gia lớp học thành công' })
  async joinClassroom(
    @CurrentUser('userId') studentId: string,
    @Body() dto: JoinClassroomDto,
  ) {
    const classroom = await this.classroomsService.joinClassroom(
      studentId,
      dto.code,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `Chúc mừng bạn đã gia nhập lớp học "${classroom.name}"!`,
      data: classroom,
    };
  }

  @Get('classrooms/:id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin lớp học và danh sách thành viên' })
  @ApiResponse({ status: 200, description: 'Chi tiết lớp học' })
  async getClassroomById(
    @Param('id') classroomId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const classroom = await this.classroomsService.findById(
      classroomId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết lớp học thành công',
      data: classroom,
    };
  }

  @Patch('classrooms/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên chỉnh sửa thông tin lớp học' })
  @ApiResponse({ status: 200, description: 'Cập nhật lớp học thành công' })
  async updateClassroom(
    @Param('id') classroomId: string,
    @CurrentUser('userId') teacherId: string,
    @Body() dto: UpdateClassroomDto,
  ) {
    const updated = await this.classroomsService.updateClassroom(
      classroomId,
      teacherId,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin lớp học thành công',
      data: updated,
    };
  }

  @Delete('classrooms/:id/leave')
  @ApiOperation({ summary: 'Học viên rời khỏi lớp học' })
  @ApiResponse({ status: 200, description: 'Rời lớp thành công' })
  async leaveClassroom(
    @Param('id') classroomId: string,
    @CurrentUser('userId') studentId: string,
  ) {
    const result = await this.classroomsService.leaveClassroom(
      classroomId,
      studentId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: null,
    };
  }

  @Delete('classrooms/:id/students/:studentId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên xóa một học viên khỏi lớp' })
  @ApiResponse({ status: 200, description: 'Xóa học viên thành công' })
  async removeStudent(
    @Param('id') classroomId: string,
    @CurrentUser('userId') teacherId: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.classroomsService.removeStudent(
      classroomId,
      teacherId,
      studentId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      data: null,
    };
  }

  @Post('classrooms/:id/assignments')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên giao bài tập mới cho lớp học' })
  @ApiResponse({ status: 201, description: 'Giao bài tập thành công' })
  async createAssignment(
    @Param('id') classroomId: string,
    @CurrentUser('userId') teacherId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    const assignment = await this.classroomsService.createAssignment(
      classroomId,
      teacherId,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Giao bài tập mới cho lớp học thành công',
      data: assignment,
    };
  }

  @Get('classrooms/:id/assignments')
  @ApiOperation({ summary: 'Lấy danh sách các bài tập trong lớp học kèm trạng thái nộp bài' })
  @ApiResponse({ status: 200, description: 'Danh sách bài tập' })
  async getAssignments(
    @Param('id') classroomId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const assignments = await this.classroomsService.getAssignments(
      classroomId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bài tập thành công',
      data: assignments,
    };
  }

  @Get('classrooms/:id/gradebook')
  @ApiOperation({ summary: 'Xem sổ điểm ma trận và bảng xếp hạng thi đua lớp học' })
  @ApiResponse({ status: 200, description: 'Sổ điểm và bảng xếp hạng lớp học' })
  async getGradebook(
    @Param('id') classroomId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const gradebook = await this.classroomsService.getClassroomGradebook(
      classroomId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy sổ điểm lớp học thành công',
      data: gradebook,
    };
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: 'Xem chi tiết một bài tập và trạng thái làm bài cá nhân' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài tập' })
  async getAssignmentDetail(
    @Param('id') assignmentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const assignment = await this.classroomsService.getAssignmentById(
      assignmentId,
      userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết bài tập thành công',
      data: assignment,
    };
  }

  @Post('assignments/:id/submit')
  @ApiOperation({ summary: 'Học viên nộp bài tập' })
  @ApiResponse({ status: 200, description: 'Nộp bài tập thành công' })
  async submitAssignment(
    @Param('id') assignmentId: string,
    @CurrentUser('userId') studentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    const submission = await this.classroomsService.submitAssignment(
      assignmentId,
      studentId,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Nộp bài tập thành công!',
      data: submission,
    };
  }

  @Get('assignments/:id/submissions')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên xem danh sách các bài nộp của học sinh' })
  @ApiResponse({ status: 200, description: 'Danh sách bài nộp' })
  async getSubmissions(
    @Param('id') assignmentId: string,
    @CurrentUser('userId') teacherId: string,
  ) {
    const submissions =
      await this.classroomsService.getSubmissionsForAssignment(
        assignmentId,
        teacherId,
      );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bài nộp thành công',
      data: submissions,
    };
  }

  @Patch('submissions/:id/grade')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Giáo viên chấm điểm và nhận xét bài nộp' })
  @ApiResponse({ status: 200, description: 'Chấm điểm thành công' })
  async gradeSubmission(
    @Param('id') submissionId: string,
    @CurrentUser('userId') teacherId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const graded = await this.classroomsService.gradeSubmission(
      submissionId,
      teacherId,
      dto,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Đã hoàn tất chấm điểm và gửi nhận xét đến học viên',
      data: graded,
    };
  }
}
