/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ quản trị hệ thống, tổng hợp số liệu thống kê & quản lý tài khoản người dùng
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import {
  Vocabulary,
  VocabularyDocument,
} from '../vocabulary/schemas/vocabulary.schema';
import {
  GrammarLesson,
  GrammarLessonDocument,
} from '../grammar/schemas/grammar-lesson.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import {
  Question,
  QuestionDocument,
} from '../quizzes/schemas/question.schema';
import {
  Classroom,
  ClassroomDocument,
} from '../classrooms/schemas/classroom.schema';
import {
  SystemSetting,
  SystemSettingDocument,
} from './schemas/system-setting.schema';
import { UpdateHomepageHeroDto } from './dto/homepage-settings.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Vocabulary.name)
    private readonly vocabularyModel: Model<VocabularyDocument>,
    @InjectModel(GrammarLesson.name)
    private readonly grammarModel: Model<GrammarLessonDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    @InjectModel(SystemSetting.name)
    private readonly systemSettingModel: Model<SystemSettingDocument>,
  ) {}

  /**
   * Tổng hợp toàn bộ số liệu thống kê & báo cáo KPI toàn hệ thống
   */
  async getSystemStats() {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      totalTopics,
      totalVocabularies,
      totalGrammars,
      totalQuizzes,
      totalQuestions,
      totalClassrooms,
      xpAggregation,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ role: Role.STUDENT }).exec(),
      this.userModel.countDocuments({ role: Role.TEACHER }).exec(),
      this.userModel.countDocuments({ role: Role.ADMIN }).exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ isActive: false }).exec(),
      this.topicModel.countDocuments().exec(),
      this.vocabularyModel.countDocuments().exec(),
      this.grammarModel.countDocuments().exec(),
      this.quizModel.countDocuments().exec(),
      this.questionModel.countDocuments().exec(),
      this.classroomModel.countDocuments().exec(),
      this.userModel.aggregate([
        {
          $group: {
            _id: null,
            totalXP: { $sum: '$totalXP' },
            avgStreak: { $avg: '$streak' },
          },
        },
      ]),
      this.userModel
        .find()
        .select('_id fullName email role avatar streak totalXP isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
    ]);

    const totalSystemXP = xpAggregation[0]?.totalXP || 0;
    const avgStreak = Math.round((xpAggregation[0]?.avgStreak || 0) * 10) / 10;

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      content: {
        totalTopics,
        totalVocabularies,
        totalGrammars,
        totalQuizzes,
        totalQuestions,
        totalClassrooms,
      },
      engagement: {
        totalXP: totalSystemXP,
        avgStreak,
        recentUsers,
      },
      system: {
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMB: Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024,
        ),
        serverTime: new Date().toISOString(),
      },
    };
  }

  /**
   * Quản lý danh sách người dùng với tìm kiếm, lọc theo vai trò, trạng thái và phân trang
   */
  async getUsersList(
    page = 1,
    limit = 10,
    search?: string,
    role?: Role,
    status?: 'active' | 'inactive',
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -hashedRefreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Cập nhật vai trò (Role) người dùng
   */
  async updateUserRole(userId: string, newRole: Role) {
    if (!Object.values(Role).includes(newRole)) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: newRole }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    this.logger.log(`Admin đã cập nhật vai trò của [${user.email}] thành [${newRole}]`);
    return user;
  }

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  async updateUserStatus(
    userId: string,
    isActive: boolean,
    currentAdminId: string,
  ) {
    if (userId === currentAdminId && !isActive) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản Admin của chính mình');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { isActive }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    this.logger.log(
      `Admin đã ${isActive ? 'MỞ KHÓA' : 'KHÓA'} tài khoản của [${user.email}]`,
    );
    return user;
  }

  /**
   * Xóa tài khoản người dùng khỏi hệ thống
   */
  async deleteUser(userId: string, currentAdminId: string) {
    if (userId === currentAdminId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản Admin của chính mình');
    }

    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    this.logger.log(`Admin đã XÓA vĩnh viễn tài khoản [${user.email}]`);
    return {
      deleted: true,
      userId: user._id,
      email: user.email,
    };
  }

  /**
   * Cập nhật ảnh đại diện của người dùng (Admin)
   */
  async updateUserAvatar(userId: string, avatar: string | null) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { avatar: avatar || null }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    this.logger.log(`Admin đã cập nhật ảnh đại diện cho [${user.email}]`);
    return user;
  }

  /**
   * Giám sát danh mục học liệu & lớp học toàn hệ thống
   */
  async getContentSummary() {
    const [recentTopics, recentGrammars, recentQuizzes, recentClassrooms] =
      await Promise.all([
        this.topicModel
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select('title level totalWords icon color isPublished createdAt')
          .exec(),
        this.grammarModel
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select('title level order isPublished createdAt')
          .exec(),
        this.quizModel
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select('title level timeLimit questions totalXP createdAt')
          .exec(),
        this.classroomModel
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate('teacher', 'fullName email')
          .select('name code description students isActive createdAt')
          .exec(),
      ]);

    return {
      topics: recentTopics,
      grammars: recentGrammars,
      quizzes: recentQuizzes,
      classrooms: recentClassrooms,
    };
  }

  /**
   * Lấy cấu hình ảnh nền và hiệu ứng Hero trang chủ
   */
  async getHomepageSettings() {
    const setting = await this.systemSettingModel
      .findOne({ key: 'homepage_hero' })
      .exec();

    if (!setting || !setting.value) {
      return {
        backgroundUrl: '',
        overlayOpacity: 0.5,
        blurAmount: 0,
        isEnabled: false,
        brandName: 'TopEnglish',
        brandSubtitle: 'by HoangBao',
        heroTitle: 'Chinh phục tiếng Anh với',
        heroHighlight: 'TopEnglish',
        heroSubtitle:
          'Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.',
        heroBadge: 'Nền tảng học tiếng Anh thông minh thế hệ mới',
      };
    }

    return {
      backgroundUrl: setting.value.backgroundUrl || '',
      overlayOpacity:
        typeof setting.value.overlayOpacity === 'number'
          ? setting.value.overlayOpacity
          : 0.5,
      blurAmount:
        typeof setting.value.blurAmount === 'number'
          ? setting.value.blurAmount
          : 0,
      isEnabled:
        typeof setting.value.isEnabled === 'boolean'
          ? setting.value.isEnabled
          : true,
      brandName: setting.value.brandName || 'TopEnglish',
      brandSubtitle: setting.value.brandSubtitle || 'by HoangBao',
      heroTitle: setting.value.heroTitle || 'Chinh phục tiếng Anh với',
      heroHighlight: setting.value.heroHighlight || 'TopEnglish',
      heroSubtitle:
        setting.value.heroSubtitle ||
        'Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.',
      heroBadge:
        setting.value.heroBadge ||
        'Nền tảng học tiếng Anh thông minh thế hệ mới',
      updatedAt: (setting as any).updatedAt,
      updatedBy: setting.updatedBy,
    };
  }

  /**
   * Cập nhật cấu hình ảnh nền và hiệu ứng Hero trang chủ (Admin)
   */
  async updateHomepageSettings(
    dto: UpdateHomepageHeroDto,
    adminId?: string,
  ) {
    const existing = await this.systemSettingModel
      .findOne({ key: 'homepage_hero' })
      .exec();
    const existingVal = existing?.value || {};

    const value = {
      backgroundUrl:
        dto.backgroundUrl !== undefined
          ? dto.backgroundUrl
          : existingVal.backgroundUrl || '',
      overlayOpacity:
        typeof dto.overlayOpacity === 'number'
          ? dto.overlayOpacity
          : existingVal.overlayOpacity ?? 0.5,
      blurAmount:
        typeof dto.blurAmount === 'number'
          ? dto.blurAmount
          : existingVal.blurAmount ?? 0,
      isEnabled:
        typeof dto.isEnabled === 'boolean'
          ? dto.isEnabled
          : existingVal.isEnabled ?? true,
      brandName:
        dto.brandName !== undefined
          ? dto.brandName
          : existingVal.brandName || 'TopEnglish',
      brandSubtitle:
        dto.brandSubtitle !== undefined
          ? dto.brandSubtitle
          : existingVal.brandSubtitle || 'by HoangBao',
      heroTitle:
        dto.heroTitle !== undefined
          ? dto.heroTitle
          : existingVal.heroTitle || 'Chinh phục tiếng Anh với',
      heroHighlight:
        dto.heroHighlight !== undefined
          ? dto.heroHighlight
          : existingVal.heroHighlight || 'TopEnglish',
      heroSubtitle:
        dto.heroSubtitle !== undefined
          ? dto.heroSubtitle
          : existingVal.heroSubtitle ||
            'Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.',
      heroBadge:
        dto.heroBadge !== undefined
          ? dto.heroBadge
          : existingVal.heroBadge ||
            'Nền tảng học tiếng Anh thông minh thế hệ mới',
    };

    const updated = await this.systemSettingModel
      .findOneAndUpdate(
        { key: 'homepage_hero' },
        {
          $set: {
            value,
            description: 'Cấu hình ảnh nền Hero trang chủ TopEnglish',
            updatedBy: adminId || 'admin',
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    this.logger.log(`Admin [${adminId}] đã cập nhật cấu hình ảnh nền trang chủ: ${dto.backgroundUrl}`);

    return {
      ...value,
      updatedAt: (updated as any)?.updatedAt || new Date(),
    };
  }
}
