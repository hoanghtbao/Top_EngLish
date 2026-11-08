/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ quản lý chủ đề từ vựng (Topics)
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
import { Topic, TopicDocument } from './schemas/topic.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { EnglishLevel } from './enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class TopicsService implements OnModuleInit {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự động khởi tạo dữ liệu mẫu 3 chủ đề tiếng Anh nếu collection rỗng
   */
  async onModuleInit() {
    const count = await this.topicModel.countDocuments();
    if (count === 0) {
      const admin = await this.userModel.findOne({ role: Role.ADMIN });
      if (!admin) {
        this.logger.warn('⚠️ Không tìm thấy tài khoản Admin để gán quyền tạo chủ đề mẫu');
        return;
      }

      const sampleTopics = [
        {
          title: 'Daily Life & Routine',
          slug: 'daily-life-and-routine',
          description: 'Từ vựng thông dụng về thói quen sinh hoạt hằng ngày, ăn uống và việc nhà.',
          level: EnglishLevel.A1,
          image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
          wordCount: 0,
          createdBy: admin._id,
        },
        {
          title: 'Travel & Adventure',
          slug: 'travel-and-adventure',
          description: 'Hành trang từ vựng thiết yếu cho sân bay, khách sạn, khám phá văn hóa và du lịch.',
          level: EnglishLevel.A2,
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
          wordCount: 0,
          createdBy: admin._id,
        },
        {
          title: 'Technology & AI',
          slug: 'technology-and-ai',
          description: 'Từ vựng chuyên ngành công nghệ thông tin, trí tuệ nhân tạo và điện toán đám mây.',
          level: EnglishLevel.B1,
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
          wordCount: 0,
          createdBy: admin._id,
        },
      ];

      await this.topicModel.insertMany(sampleTopics);
      this.logger.log('🌱 Đã tự động khởi tạo 3 chủ đề từ vựng mẫu (A1, A2, B1)');
    }
  }

  /**
   * Hàm chuyển đổi chuỗi tiêu đề thành slug chuẩn URL
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  /**
   * Lấy danh sách chủ đề theo bộ lọc trình độ và tìm kiếm từ khóa
   */
  async findAll(query?: { level?: EnglishLevel; search?: string }): Promise<TopicDocument[]> {
    const filter: Record<string, any> = {};

    if (query?.level) {
      filter.level = query.level;
    }

    if (query?.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    return this.topicModel.find(filter).populate('createdBy', 'fullName email').sort({ createdAt: -1 }).exec();
  }

  /**
   * Tìm kiếm chủ đề theo ID hoặc Slug
   */
  async findByIdOrSlug(idOrSlug: string): Promise<TopicDocument> {
    let topic: TopicDocument | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      topic = await this.topicModel.findById(idOrSlug).populate('createdBy', 'fullName email').exec();
    }

    if (!topic) {
      topic = await this.topicModel.findOne({ slug: idOrSlug }).populate('createdBy', 'fullName email').exec();
    }

    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề với định danh "${idOrSlug}"`);
    }

    return topic;
  }

  /**
   * Tạo chủ đề từ vựng mới
   */
  async create(createTopicDto: CreateTopicDto, userId: string): Promise<TopicDocument> {
    const slug = createTopicDto.slug || this.generateSlug(createTopicDto.title);

    const existingSlug = await this.topicModel.findOne({ slug });
    if (existingSlug) {
      throw new BadRequestException(`Slug "${slug}" đã tồn tại trên hệ thống, vui lòng đổi tên khác`);
    }

    const createdTopic = new this.topicModel({
      ...createTopicDto,
      slug,
      wordCount: 0,
      createdBy: new Types.ObjectId(userId),
    });

    return createdTopic.save();
  }

  /**
   * Cập nhật thông tin chủ đề
   */
  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<TopicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID chủ đề không hợp lệ');
    }

    if (updateTopicDto.slug) {
      const existing = await this.topicModel.findOne({
        slug: updateTopicDto.slug,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new BadRequestException(`Slug "${updateTopicDto.slug}" đã bị trùng lặp`);
      }
    }

    const updated = await this.topicModel
      .findByIdAndUpdate(id, { $set: updateTopicDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy chủ đề có ID ${id}`);
    }

    return updated;
  }

  /**
   * Xóa chủ đề
   */
  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID chủ đề không hợp lệ');
    }

    const result = await this.topicModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Không tìm thấy chủ đề có ID ${id}`);
    }

    return { deleted: true, message: `Đã xóa thành công chủ đề "${result.title}"` };
  }

  /**
   * Tăng hoặc giảm số lượng từ vựng của chủ đề
   */
  async updateWordCount(topicId: string | Types.ObjectId, delta: number): Promise<void> {
    await this.topicModel.findByIdAndUpdate(topicId, { $inc: { wordCount: delta } }).exec();
  }
}
