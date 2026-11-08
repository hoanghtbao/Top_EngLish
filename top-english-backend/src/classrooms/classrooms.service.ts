/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ quản lý lớp học trực tuyến, giao bài tập, nộp bài, chấm điểm và sổ điểm lớp học
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Classroom, ClassroomDocument } from './schemas/classroom.schema';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import {
  Submission,
  SubmissionDocument,
  SubmissionStatus,
} from './schemas/submission.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Injectable()
export class ClassroomsService {
  private readonly logger = new Logger(ClassroomsService.name);

  constructor(
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Sinh mã mời vào lớp duy nhất định dạng TOP-XXXXX
   */
  private generateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TOP-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Giáo viên / Quản trị viên khởi tạo lớp học mới
   */
  async createClassroom(
    teacherId: string,
    dto: CreateClassroomDto,
  ): Promise<Classroom> {
    let uniqueCode = '';
    let isUnique = false;
    let attempts = 0;

    // Sinh mã lớp duy nhất
    while (!isUnique && attempts < 10) {
      uniqueCode = this.generateClassCode();
      const existing = await this.classroomModel.findOne({ code: uniqueCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    const newClassroom = new this.classroomModel({
      ...dto,
      code: uniqueCode,
      teacher: new Types.ObjectId(teacherId),
      students: [],
      isActive: true,
    });

    const saved = await newClassroom.save();
    this.logger.log(
      `Đã tạo lớp học mới: "${saved.name}" (Mã: ${saved.code}) bởi Giáo viên ID ${teacherId}`,
    );
    return saved;
  }

  /**
   * Lấy danh sách lớp học theo vai trò người dùng (Teacher, Student hoặc Admin)
   */
  async findAllForUser(userId: string, role: Role): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);
    let filter: any = { isActive: true };

    if (role === Role.TEACHER) {
      // Giáo viên: Lấy các lớp do mình phụ trách
      filter = { teacher: userObjectId, isActive: true };
    } else if (role === Role.STUDENT) {
      // Học viên: Lấy các lớp mình đã tham gia
      filter = { students: userObjectId, isActive: true };
    }

    const classrooms = await this.classroomModel
      .find(filter)
      .populate('teacher', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Thống kê số lượng bài tập và học viên cho mỗi lớp
    const enriched = await Promise.all(
      classrooms.map(async (cls) => {
        const assignmentCount = await this.assignmentModel.countDocuments({
          classroom: cls._id,
          isActive: true,
        });
        return {
          ...cls,
          studentCount: cls.students ? cls.students.length : 0,
          assignmentCount,
        };
      }),
    );

    return enriched;
  }

  /**
   * Xem chi tiết thông tin lớp học (danh sách học viên, giáo viên)
   */
  async findById(classroomId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(classroomId)) {
      throw new BadRequestException('ID lớp học không hợp lệ');
    }

    const classroom = await this.classroomModel
      .findById(classroomId)
      .populate('teacher', 'fullName email avatar')
      .populate('students', 'fullName email avatar streak totalXP createdAt')
      .lean();

    if (!classroom || !classroom.isActive) {
      throw new NotFoundException('Không tìm thấy lớp học này hoặc lớp đã bị đóng');
    }

    const isTeacher =
      classroom.teacher && (classroom.teacher as any)._id.toString() === userId;
    const isEnrolled =
      classroom.students &&
      classroom.students.some((s: any) => s._id.toString() === userId);

    return {
      ...classroom,
      studentCount: classroom.students?.length || 0,
      isTeacher,
      isEnrolled,
    };
  }

  /**
   * Học viên tham gia lớp học bằng mã mời
   */
  async joinClassroom(studentId: string, code: string): Promise<Classroom> {
    const normalizedCode = code.trim().toUpperCase();
    const classroom = await this.classroomModel.findOne({
      code: normalizedCode,
      isActive: true,
    });

    if (!classroom) {
      throw new NotFoundException(
        `Không tìm thấy lớp học với mã "${normalizedCode}". Vui lòng kiểm tra lại mã mời!`,
      );
    }

    const studentObjectId = new Types.ObjectId(studentId);

    // Kiểm tra học sinh đã tham gia lớp chưa
    const alreadyJoined = classroom.students.some((id) =>
      id.equals(studentObjectId),
    );
    if (alreadyJoined) {
      throw new BadRequestException('Bạn đã tham gia vào lớp học này rồi!');
    }

    // Kiểm tra sĩ số lớp nếu có giới hạn
    if (
      classroom.maxStudents > 0 &&
      classroom.students.length >= classroom.maxStudents
    ) {
      throw new BadRequestException(
        `Lớp học đã đạt sĩ số tối đa (${classroom.maxStudents} học viên)!`,
      );
    }

    classroom.students.push(studentObjectId);
    await classroom.save();

    this.logger.log(
      `Học viên ID ${studentId} đã tham gia thành công lớp học "${classroom.name}" (Mã: ${classroom.code})`,
    );
    return classroom;
  }

  /**
   * Học viên rời khỏi lớp học
   */
  async leaveClassroom(classroomId: string, studentId: string): Promise<any> {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const studentObjectId = new Types.ObjectId(studentId);
    classroom.students = classroom.students.filter(
      (id) => !id.equals(studentObjectId),
    );
    await classroom.save();

    return { message: 'Đã rời khỏi lớp học thành công' };
  }

  /**
   * Giáo viên xóa một học viên ra khỏi lớp học
   */
  async removeStudent(
    classroomId: string,
    teacherId: string,
    studentId: string,
  ): Promise<any> {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    if (classroom.teacher.toString() !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền quản lý lớp học này');
    }

    const studentObjectId = new Types.ObjectId(studentId);
    classroom.students = classroom.students.filter(
      (id) => !id.equals(studentObjectId),
    );
    await classroom.save();

    return { message: 'Đã xóa học viên ra khỏi lớp thành công' };
  }

  /**
   * Chỉnh sửa thông tin lớp học
   */
  async updateClassroom(
    classroomId: string,
    teacherId: string,
    dto: UpdateClassroomDto,
  ): Promise<Classroom> {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    if (classroom.teacher.toString() !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa lớp học này');
    }

    Object.assign(classroom, dto);
    return await classroom.save();
  }

  /**
   * Giáo viên giao bài tập mới cho lớp
   */
  async createAssignment(
    classroomId: string,
    teacherId: string,
    dto: CreateAssignmentDto,
  ): Promise<Assignment> {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    if (classroom.teacher.toString() !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền giao bài tập cho lớp học này');
    }

    const assignment = new this.assignmentModel({
      ...dto,
      classroom: new Types.ObjectId(classroomId),
      teacher: new Types.ObjectId(teacherId),
      dueDate: new Date(dto.dueDate),
      maxScore: dto.maxScore || 100,
      isActive: true,
    });

    const saved = await assignment.save();
    this.logger.log(
      `Đã tạo bài tập mới: "${saved.title}" cho lớp ${classroom.name}`,
    );
    return saved;
  }

  /**
   * Lấy danh sách bài tập của lớp học kèm trạng thái nộp bài cá nhân
   */
  async getAssignments(classroomId: string, userId: string): Promise<any[]> {
    const assignments = await this.assignmentModel
      .find({ classroom: new Types.ObjectId(classroomId), isActive: true })
      .sort({ dueDate: 1 })
      .lean();

    const userObjectId = new Types.ObjectId(userId);

    // Lấy trạng thái nộp bài của người dùng hiện tại
    const enriched = await Promise.all(
      assignments.map(async (asg) => {
        const submission = await this.submissionModel
          .findOne({
            assignment: asg._id,
            student: userObjectId,
          })
          .lean();

        // Đếm tổng số bài đã nộp trên tổng sĩ số lớp
        const totalSubmissions = await this.submissionModel.countDocuments({
          assignment: asg._id,
        });

        const isOverdue = new Date() > new Date(asg.dueDate);

        return {
          ...asg,
          totalSubmissions,
          isOverdue,
          mySubmission: submission
            ? {
                _id: submission._id,
                status: submission.status,
                score: submission.score,
                teacherFeedback: submission.teacherFeedback,
                submittedAt: submission.submittedAt,
                gradedAt: submission.gradedAt,
              }
            : null,
        };
      }),
    );

    return enriched;
  }

  /**
   * Xem chi tiết một bài tập
   */
  async getAssignmentById(assignmentId: string, userId: string): Promise<any> {
    const assignment = await this.assignmentModel
      .findById(assignmentId)
      .populate('classroom', 'name code teacher themeColor')
      .populate('teacher', 'fullName email avatar')
      .lean();

    if (!assignment || !assignment.isActive) {
      throw new NotFoundException('Không tìm thấy bài tập hoặc bài tập đã kết thúc');
    }

    const submission = await this.submissionModel
      .findOne({
        assignment: new Types.ObjectId(assignmentId),
        student: new Types.ObjectId(userId),
      })
      .lean();

    return {
      ...assignment,
      mySubmission: submission || null,
    };
  }

  /**
   * Học viên nộp bài tập
   */
  async submitAssignment(
    assignmentId: string,
    studentId: string,
    dto: SubmitAssignmentDto,
  ): Promise<Submission> {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment || !assignment.isActive) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    const classroom = await this.classroomModel.findById(assignment.classroom);
    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const studentObjectId = new Types.ObjectId(studentId);
    const isEnrolled = classroom.students.some((id) =>
      id.equals(studentObjectId),
    );
    if (!isEnrolled) {
      throw new ForbiddenException('Bạn chưa tham gia lớp học này để nộp bài!');
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    let initialStatus = isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED;

    // Nếu có điểm số ngay (ví dụ bài quiz nộp kèm điểm số)
    if (dto.score !== undefined && dto.score !== null) {
      initialStatus = SubmissionStatus.GRADED;
    }

    // Cập nhật bài nộp cũ hoặc tạo bài nộp mới (Upsert)
    const submission = await this.submissionModel.findOneAndUpdate(
      {
        assignment: assignment._id,
        student: studentObjectId,
      },
      {
        classroom: classroom._id,
        status: initialStatus,
        content: dto.content || '',
        quizResultId: dto.quizResultId || null,
        score: dto.score !== undefined ? dto.score : null,
        submittedAt: new Date(),
        gradedAt: dto.score !== undefined ? new Date() : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    this.logger.log(
      `Học viên ID ${studentId} đã nộp bài tập "${assignment.title}" (Trạng thái: ${initialStatus})`,
    );
    return submission;
  }

  /**
   * Giáo viên xem danh sách các bài làm đã nộp của một bài tập
   */
  async getSubmissionsForAssignment(
    assignmentId: string,
    teacherId: string,
  ): Promise<any[]> {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập');
    }

    const classroom = await this.classroomModel.findById(assignment.classroom);
    if (!classroom || classroom.teacher.toString() !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền quản lý bài tập này');
    }

    const submissions = await this.submissionModel
      .find({ assignment: assignment._id })
      .populate('student', 'fullName email avatar streak totalXP')
      .sort({ submittedAt: -1 })
      .lean();

    return submissions;
  }

  /**
   * Giáo viên chấm điểm và ghi nhận xét cho bài làm của học viên
   */
  async gradeSubmission(
    submissionId: string,
    teacherId: string,
    dto: GradeSubmissionDto,
  ): Promise<Submission> {
    const submission = await this.submissionModel
      .findById(submissionId)
      .populate('assignment');
    if (!submission) {
      throw new NotFoundException('Không tìm thấy bài nộp');
    }

    const assignment = submission.assignment as any;
    const classroom = await this.classroomModel.findById(assignment.classroom);
    if (!classroom || classroom.teacher.toString() !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền chấm bài nộp này');
    }

    submission.score = dto.score;
    submission.teacherFeedback = dto.teacherFeedback || '';
    submission.status = SubmissionStatus.GRADED;
    submission.gradedAt = new Date();

    const saved = await submission.save();

    // Thưởng XP cho học viên khi hoàn thành bài tập điểm tốt
    if (dto.score >= 50) {
      const xpReward = Math.min(Math.floor(dto.score / 2), 50);
      await this.userModel.findByIdAndUpdate(submission.student, {
        $inc: { totalXP: xpReward },
      });
    }

    this.logger.log(
      `Giáo viên ID ${teacherId} đã chấm bài nộp ID ${submissionId}: ${dto.score} điểm`,
    );
    return saved;
  }

  /**
   * Sổ điểm tổng hợp và bảng xếp hạng thi đua của lớp học (Class Gradebook & Leaderboard)
   */
  async getClassroomGradebook(
    classroomId: string,
    userId: string,
  ): Promise<any> {
    const classroom = await this.classroomModel
      .findById(classroomId)
      .populate('students', 'fullName email avatar streak totalXP')
      .lean();

    if (!classroom) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const assignments = await this.assignmentModel
      .find({ classroom: new Types.ObjectId(classroomId), isActive: true })
      .sort({ dueDate: 1 })
      .lean();

    const submissions = await this.submissionModel
      .find({ classroom: new Types.ObjectId(classroomId) })
      .lean();

    // Xây dựng ma trận điểm cho từng học viên
    const studentsData = (classroom.students as any[]).map((stu) => {
      const studentSubmissions = submissions.filter(
        (sub) => sub.student.toString() === stu._id.toString(),
      );

      const completedCount = studentSubmissions.length;
      const gradedList = studentSubmissions.filter((sub) => sub.score !== null);
      const totalScore = gradedList.reduce((acc, cur) => acc + (cur.score || 0), 0);
      const averageScore =
        gradedList.length > 0 ? Math.round(totalScore / gradedList.length) : 0;

      // Map điểm theo từng assignmentId
      const assignmentScores: Record<string, any> = {};
      assignments.forEach((asg) => {
        const sub = studentSubmissions.find(
          (s) => s.assignment.toString() === asg._id.toString(),
        );
        assignmentScores[asg._id.toString()] = sub
          ? {
              status: sub.status,
              score: sub.score,
              submittedAt: sub.submittedAt,
            }
          : { status: 'unsubmitted', score: null };
      });

      return {
        _id: stu._id,
        fullName: stu.fullName,
        email: stu.email,
        avatar: stu.avatar,
        streak: stu.streak || 0,
        totalXP: stu.totalXP || 0,
        completedAssignments: completedCount,
        averageScore,
        scores: assignmentScores,
      };
    });

    // Bảng xếp hạng thi đua sắp xếp theo điểm trung bình và XP
    const leaderboard = [...studentsData].sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.totalXP - a.totalXP;
    });

    return {
      classroomId: classroom._id,
      className: classroom.name,
      totalStudents: studentsData.length,
      totalAssignments: assignments.length,
      assignments: assignments.map((a) => ({
        _id: a._id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
      })),
      students: studentsData,
      leaderboard,
    };
  }
}
