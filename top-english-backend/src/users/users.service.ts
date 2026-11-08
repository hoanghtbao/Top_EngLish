/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service quản lý dữ liệu người dùng (CRUD, cập nhật token, phân quyền)
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự động khởi tạo tài khoản Quản trị viên (Admin), Giáo viên (Teacher) và Học viên (Student) mặc định nếu hệ thống chưa có
   */
  async onModuleInit() {
    // 1. Khởi tạo tài khoản Quản trị viên (Admin)
    const adminExists = await this.userModel.findOne({ role: Role.ADMIN });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await this.userModel.create({
        email: 'admin@topenglish.com',
        password: hashedPassword,
        fullName: 'Quản trị viên TopEnglish',
        role: Role.ADMIN,
        isActive: true,
      });
      this.logger.log('🌱 Đã khởi tạo tài khoản Admin mặc định: admin@topenglish.com / Admin@123');
    }

    // 2. Khởi tạo tài khoản Giáo viên (Teacher)
    const teacherExists = await this.userModel.findOne({ role: Role.TEACHER });
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash('Teacher@123', 10);
      await this.userModel.create({
        email: 'teacher@topenglish.com',
        password: hashedPassword,
        fullName: 'Cô Mai Anh',
        role: Role.TEACHER,
        isActive: true,
        streak: 5,
        totalXP: 420,
      });
      this.logger.log('🌱 Đã khởi tạo tài khoản Giáo viên mặc định: teacher@topenglish.com / Teacher@123');
    }

    // 3. Khởi tạo tài khoản Học viên (Student)
    const studentExists = await this.userModel.findOne({ role: Role.STUDENT });
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('Student@123', 10);
      await this.userModel.create({
        email: 'student@topenglish.com',
        password: hashedPassword,
        fullName: 'Nguyễn Học Viên',
        role: Role.STUDENT,
        isActive: true,
        streak: 3,
        totalXP: 180,
      });
      this.logger.log('🌱 Đã khởi tạo tài khoản Học viên mặc định: student@topenglish.com / Student@123');
    }
  }

  /**
   * Tạo tài khoản người dùng mới
   * @param data Dữ liệu người dùng (mật khẩu đã băm)
   */
  async create(data: Partial<User>): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    const newUser = new this.userModel(data);
    return newUser.save();
  }

  /**
   * Tìm người dùng theo email
   * @param email Địa chỉ email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /**
   * Tìm người dùng theo ID
   * @param id MongoDB ObjectId
   */
  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Cập nhật Refresh Token đã băm cho người dùng
   */
  async updateRefreshToken(
    userId: string | Types.ObjectId,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { hashedRefreshToken }).exec();
  }

  /**
   * Cập nhật thông tin hồ sơ (họ tên, avatar)
   */
  async updateProfile(
    userId: string,
    data: { fullName?: string; avatar?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: data }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  /**
   * Cập nhật mật khẩu mới
   */
  async updatePassword(userId: string, hashedPass: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { password: hashedPass })
      .exec();
  }

  /**
   * Quản trị: Lấy danh sách toàn bộ người dùng có phân trang
   */
  async findAll(page = 1, limit = 10, role?: Role) {
    const skip = (page - 1) * limit;
    const filter = role ? { role } : {};

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
   * Quản trị: Cập nhật vai trò (Role)
   */
  async updateRole(userId: string, role: Role): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { role }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  /**
   * Quản trị: Khóa hoặc mở khóa tài khoản
   */
  async updateStatus(userId: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { isActive }, { new: true })
      .select('-password -hashedRefreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }
}
