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
import { TopicCategory } from './enums/topic-category.enum';
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
   * Tự động khởi tạo dữ liệu mẫu cho 3 lộ trình (Hàng ngày CEFR, TOEIC, IELTS) nếu chưa tồn tại
   */
  async onModuleInit() {
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
        category: TopicCategory.GENERAL,
        level: EnglishLevel.A1,
        targetScore: '',
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Travel & Adventure',
        slug: 'travel-and-adventure',
        description: 'Hành trang từ vựng thiết yếu cho sân bay, khách sạn, khám phá văn hóa và du lịch.',
        category: TopicCategory.GENERAL,
        level: EnglishLevel.A2,
        targetScore: '',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Technology & AI',
        slug: 'technology-and-ai',
        description: 'Từ vựng chuyên ngành công nghệ thông tin, trí tuệ nhân tạo và điện toán đám mây.',
        category: TopicCategory.GENERAL,
        level: EnglishLevel.B1,
        targetScore: '',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      // --- CHUYÊN ĐỀ TOEIC ---
      {
        title: 'Office & Meetings',
        slug: 'toeic-office-and-meetings',
        description: 'Từ vựng giao tiếp văn phòng, đặt lịch hẹn, hội họp và báo cáo công việc chuẩn TOEIC.',
        category: TopicCategory.TOEIC,
        level: EnglishLevel.A2,
        targetScore: '450+',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Finance & Contracts',
        slug: 'toeic-finance-and-contracts',
        description: 'Thuật ngữ tài chính, hóa đơn, hợp đồng thương mại và đàm phán doanh nghiệp.',
        category: TopicCategory.TOEIC,
        level: EnglishLevel.B1,
        targetScore: '600+',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Logistics & Supply Chain',
        slug: 'toeic-logistics-and-supply',
        description: 'Từ vựng vận chuyển, kho bãi, xuất nhập khẩu và quản trị chuỗi cung ứng.',
        category: TopicCategory.TOEIC,
        level: EnglishLevel.B2,
        targetScore: '750+',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Executive Strategy',
        slug: 'toeic-executive-strategy',
        description: 'Từ vựng nâng cao về chiến lược điều hành, sáp nhập doanh nghiệp và kiểm toán.',
        category: TopicCategory.TOEIC,
        level: EnglishLevel.C1,
        targetScore: '900+',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      // --- CHUYÊN ĐỀ IELTS ---
      {
        title: 'Education & Research',
        slug: 'ielts-education-and-research',
        description: 'Từ vựng học thuật về giáo dục, phương pháp giảng dạy và nghiên cứu khoa học.',
        category: TopicCategory.IELTS,
        level: EnglishLevel.B1,
        targetScore: 'Band 5.5',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Environment & Climate',
        slug: 'ielts-environment-and-climate',
        description: 'Từ vựng đắt giá cho IELTS Writing & Speaking về biến đổi khí hậu và hệ sinh thái.',
        category: TopicCategory.IELTS,
        level: EnglishLevel.B2,
        targetScore: 'Band 6.5',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Urbanization & Society',
        slug: 'ielts-urbanization-and-society',
        description: 'Từ vựng học thuật nâng cao về đô thị hóa, chính sách xã hội và phát triển bền vững.',
        category: TopicCategory.IELTS,
        level: EnglishLevel.C1,
        targetScore: 'Band 7.5+',
        image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
    ];

    const existingSlugs = new Set(
      (await this.topicModel.find({}, { slug: 1 }).lean().exec()).map((t) => t.slug),
    );

    const toInsert = sampleTopics.filter((t) => !existingSlugs.has(t.slug));
    if (toInsert.length > 0) {
      await this.topicModel.insertMany(toInsert);
      this.logger.log(`🌱 Đã tự động khởi tạo ${toInsert.length} chủ đề từ vựng mẫu (CEFR, TOEIC, IELTS)`);
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
   * Lấy danh sách chủ đề theo bộ lọc lộ trình, trình độ, mục tiêu và tìm kiếm từ khóa
   */
  async findAll(query?: {
    category?: TopicCategory;
    level?: EnglishLevel;
    targetScore?: string;
    search?: string;
  }): Promise<TopicDocument[]> {
    const andConditions: Record<string, any>[] = [];

    if (query?.category) {
      if (query.category === TopicCategory.GENERAL) {
        // Hỗ trợ các chủ đề cũ chưa có trường category được xem là GENERAL (CEFR)
        andConditions.push({
          $or: [
            { category: TopicCategory.GENERAL },
            { category: { $exists: false } },
            { category: null },
          ],
        });
      } else {
        andConditions.push({ category: query.category });
      }
    }

    if (query?.level) {
      andConditions.push({ level: query.level });
    }

    if (query?.targetScore) {
      andConditions.push({ targetScore: query.targetScore });
    }

    if (query?.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      andConditions.push({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

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
