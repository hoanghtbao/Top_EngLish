/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ Lớp học từ vựng (VocabClasses) và Bài học (Topics)
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
import { VocabClass, VocabClassDocument } from './schemas/vocab-class.schema';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateVocabClassDto } from './dto/create-vocab-class.dto';
import { UpdateVocabClassDto } from './dto/update-vocab-class.dto';
import { EnglishLevel } from './enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class TopicsService implements OnModuleInit {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel(VocabClass.name)
    private readonly vocabClassModel: Model<VocabClassDocument>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự động dọn dẹp dữ liệu đa lộ trình cũ (nếu có) và khởi tạo Lớp học + Bài học mẫu
   */
  async onModuleInit() {
    const admin = await this.userModel.findOne({ role: Role.ADMIN });
    if (!admin) {
      this.logger.warn('⚠️ Không tìm thấy tài khoản Admin để khởi tạo lớp học mẫu');
      return;
    }

    // Dọn dẹp 7 chủ đề đa lộ trình cũ nếu còn sót lại
    const legacyTrackSlugs = [
      'toeic-office-and-meetings',
      'toeic-finance-and-contracts',
      'toeic-logistics-and-supply',
      'toeic-executive-strategy',
      'ielts-education-and-research',
      'ielts-environment-and-climate',
      'ielts-urbanization-and-society',
    ];
    await this.topicModel.deleteMany({ slug: { $in: legacyTrackSlugs } }).exec();

    // Đảm bảo 3 topic nền tảng vẫn tồn tại để quizzes.service.ts hoạt động ổn định
    const baseTopics = [
      {
        title: 'Daily Life & Routine',
        slug: 'daily-life-and-routine',
        description: 'Từ vựng thông dụng về thói quen sinh hoạt hằng ngày, ăn uống và việc nhà.',
        level: EnglishLevel.A1,
        tag: 'Daily Routine',
        lessonNumber: 1,
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Travel & Adventure',
        slug: 'travel-and-adventure',
        description: 'Hành trang từ vựng thiết yếu cho sân bay, khách sạn, khám phá văn hóa và du lịch.',
        level: EnglishLevel.A2,
        tag: 'Travel',
        lessonNumber: 2,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
      {
        title: 'Technology & AI',
        slug: 'technology-and-ai',
        description: 'Từ vựng chuyên ngành công nghệ thông tin, trí tuệ nhân tạo và điện toán đám mây.',
        level: EnglishLevel.B1,
        tag: 'Technology',
        lessonNumber: 3,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        wordCount: 0,
        createdBy: admin._id,
      },
    ];

    const existingSlugs = new Set(
      (await this.topicModel.find({}, { slug: 1 }).lean().exec()).map((t) => t.slug),
    );
    const missingBase = baseTopics.filter((t) => !existingSlugs.has(t.slug));
    if (missingBase.length > 0) {
      await this.topicModel.insertMany(missingBase);
    }

    // Khởi tạo Lớp học mẫu nếu collection vocab_classes còn trống
    const classCount = await this.vocabClassModel.countDocuments();
    if (classCount === 0) {
      const toeicClass = await this.vocabClassModel.create({
        name: 'TOEIC 2',
        code: 'TE2',
        description: 'Học toeic 4 kĩ năng',
        createdBy: admin._id,
      });

      const foundationClass = await this.vocabClassModel.create({
        name: 'English Foundation',
        code: 'EF1',
        description: 'Từ vựng giao tiếp nền tảng, du lịch và công nghệ',
        createdBy: admin._id,
      });

      // Gán các bài học cơ bản vào lớp English Foundation
      await this.topicModel.updateMany(
        { vocabClassId: null },
        { $set: { vocabClassId: foundationClass._id } },
      );

      // Tạo 2 bài học mẫu trong lớp TOEIC 2 giống cấu trúc chuẩn
      const sampleLessons = [
        {
          vocabClassId: toeicClass._id,
          lessonNumber: 1,
          tag: 'Articles & Reports',
          title: 'Lesson 8: A. Reading - Articles & Reports',
          slug: 'toeic2-lesson-8-articles-reports',
          description: 'Target skills: Reading Part 7: Articles & Reports | Writing: Review for Questions 6&7',
          level: EnglishLevel.B1,
          wordCount: 0,
          createdBy: admin._id,
        },
        {
          vocabClassId: toeicClass._id,
          lessonNumber: 2,
          tag: 'Everyday Transactions & Inquiries',
          title: 'Lesson 7: A. Listening - Everyday Transactions & Inquiries',
          slug: 'toeic2-lesson-7-everyday-transactions',
          description: 'Target skills: Listening & Speaking: Review Speaking Questions 8-10',
          level: EnglishLevel.B1,
          wordCount: 0,
          createdBy: admin._id,
        },
      ];

      for (const lesson of sampleLessons) {
        const exists = await this.topicModel.findOne({ slug: lesson.slug }).exec();
        if (!exists) {
          await this.topicModel.create(lesson);
        }
      }

      this.logger.log('🌱 Đã tự động khởi tạo lớp học mẫu TOEIC 2 (TE2) & English Foundation (EF1)');
    }
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  // =========================================================================
  // LỚP HỌC TỪ VỰNG (VOCAB CLASSES)
  // =========================================================================

  async findAllClasses(search?: string) {
    const filter: Record<string, any> = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const classes = await this.vocabClassModel
      .find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Đếm số bài học và tổng số từ vựng cho từng lớp học
    const stats = await this.topicModel.aggregate([
      { $match: { vocabClassId: { $ne: null } } },
      {
        $group: {
          _id: '$vocabClassId',
          lessonCount: { $sum: 1 },
          totalWords: { $sum: '$wordCount' },
        },
      },
    ]);

    const statMap = new Map<string, { lessonCount: number; totalWords: number }>();
    stats.forEach((s) => {
      statMap.set(String(s._id), {
        lessonCount: s.lessonCount || 0,
        totalWords: s.totalWords || 0,
      });
    });

    return classes.map((cls) => {
      const s = statMap.get(String(cls._id)) || { lessonCount: 0, totalWords: 0 };
      return {
        ...cls,
        lessonCount: s.lessonCount,
        totalWords: s.totalWords,
      };
    });
  }

  async findClassWithLessons(idOrCode: string) {
    let vocabClass: VocabClassDocument | null = null;

    if (Types.ObjectId.isValid(idOrCode)) {
      vocabClass = await this.vocabClassModel
        .findById(idOrCode)
        .populate('createdBy', 'fullName email')
        .exec();
    }

    if (!vocabClass) {
      vocabClass = await this.vocabClassModel
        .findOne({ code: idOrCode.trim().toUpperCase() })
        .populate('createdBy', 'fullName email')
        .exec();
    }

    if (!vocabClass) {
      throw new NotFoundException(`Không tìm thấy lớp học "${idOrCode}"`);
    }

    const lessons = await this.topicModel
      .find({ vocabClassId: vocabClass._id })
      .populate('createdBy', 'fullName email')
      .sort({ lessonNumber: 1, createdAt: 1 })
      .exec();

    return {
      classInfo: vocabClass,
      lessons,
    };
  }

  async createClass(dto: CreateVocabClassDto, userId: string): Promise<VocabClassDocument> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.vocabClassModel.findOne({ code: normalizedCode }).exec();
    if (existing) {
      throw new BadRequestException(`Mã lớp học "${normalizedCode}" đã tồn tại, vui lòng chọn mã khác`);
    }

    const created = new this.vocabClassModel({
      name: dto.name.trim(),
      code: normalizedCode,
      description: dto.description?.trim() || '',
      createdBy: new Types.ObjectId(userId),
    });

    return created.save();
  }

  async updateClass(id: string, dto: UpdateVocabClassDto): Promise<VocabClassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID lớp học không hợp lệ');
    }

    const updatePayload: Record<string, any> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description.trim();
    if (dto.code !== undefined) {
      const normalizedCode = dto.code.trim().toUpperCase();
      const dup = await this.vocabClassModel.findOne({
        code: normalizedCode,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (dup) {
        throw new BadRequestException(`Mã lớp học "${normalizedCode}" đã được sử dụng`);
      }
      updatePayload.code = normalizedCode;
    }

    const updated = await this.vocabClassModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy lớp học có ID ${id}`);
    }

    return updated;
  }

  async removeClass(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID lớp học không hợp lệ');
    }

    const deletedClass = await this.vocabClassModel.findByIdAndDelete(id).exec();
    if (!deletedClass) {
      throw new NotFoundException(`Không tìm thấy lớp học có ID ${id}`);
    }

    // Xóa các bài học thuộc lớp này (trừ các bài học mặc định được quiz hệ thống tham chiếu)
    await this.topicModel.deleteMany({ vocabClassId: new Types.ObjectId(id) }).exec();

    return {
      deleted: true,
      message: `Đã xóa thành công lớp học "${deletedClass.name}"`,
    };
  }

  // =========================================================================
  // BÀI HỌC TỪ VỰNG (TOPICS / LESSONS)
  // =========================================================================

  async findAll(query?: {
    vocabClassId?: string;
    level?: EnglishLevel;
    search?: string;
  }): Promise<TopicDocument[]> {
    const filter: Record<string, any> = {};

    if (query?.vocabClassId) {
      if (!Types.ObjectId.isValid(query.vocabClassId)) {
        throw new BadRequestException('ID lớp học không hợp lệ');
      }
      filter.vocabClassId = new Types.ObjectId(query.vocabClassId);
    }

    if (query?.level) {
      filter.level = query.level;
    }

    if (query?.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { tag: searchRegex }];
    }

    return this.topicModel
      .find(filter)
      .populate('createdBy', 'fullName email')
      .populate('vocabClassId', 'name code')
      .sort({ lessonNumber: 1, createdAt: 1 })
      .exec();
  }

  async findByIdOrSlug(idOrSlug: string): Promise<TopicDocument> {
    let topic: TopicDocument | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      topic = await this.topicModel
        .findById(idOrSlug)
        .populate('createdBy', 'fullName email')
        .populate('vocabClassId', 'name code')
        .exec();
    }

    if (!topic) {
      topic = await this.topicModel
        .findOne({ slug: idOrSlug })
        .populate('createdBy', 'fullName email')
        .populate('vocabClassId', 'name code')
        .exec();
    }

    if (!topic) {
      throw new NotFoundException(`Không tìm thấy bài học với định danh "${idOrSlug}"`);
    }

    return topic;
  }

  async create(createTopicDto: CreateTopicDto, userId: string): Promise<TopicDocument> {
    let baseSlug = createTopicDto.slug || this.generateSlug(createTopicDto.title);
    if (!baseSlug) {
      baseSlug = `lesson-${Date.now()}`;
    }

    let slug = baseSlug;
    let suffix = 1;
    while (await this.topicModel.findOne({ slug }).exec()) {
      slug = `${baseSlug}-${suffix++}`;
    }

    let vocabClassObjectId: Types.ObjectId | null = null;
    let nextLessonNumber = createTopicDto.lessonNumber;

    if (createTopicDto.vocabClassId) {
      const cls = await this.vocabClassModel.findById(createTopicDto.vocabClassId).exec();
      if (!cls) {
        throw new NotFoundException(`Không tìm thấy lớp học với ID ${createTopicDto.vocabClassId}`);
      }
      vocabClassObjectId = cls._id as Types.ObjectId;

      if (!nextLessonNumber) {
        const countInClass = await this.topicModel.countDocuments({ vocabClassId: vocabClassObjectId });
        nextLessonNumber = countInClass + 1;
      }
    }

    const createdTopic = new this.topicModel({
      ...createTopicDto,
      vocabClassId: vocabClassObjectId,
      lessonNumber: nextLessonNumber || 1,
      tag: createTopicDto.tag?.trim() || '',
      slug,
      wordCount: 0,
      createdBy: new Types.ObjectId(userId),
    });

    return createdTopic.save();
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<TopicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
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
      throw new NotFoundException(`Không tìm thấy bài học có ID ${id}`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
    }

    const result = await this.topicModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Không tìm thấy bài học có ID ${id}`);
    }

    return { deleted: true, message: `Đã xóa thành công bài học "${result.title}"` };
  }

  async updateWordCount(topicId: string | Types.ObjectId, delta: number): Promise<void> {
    await this.topicModel.findByIdAndUpdate(topicId, { $inc: { wordCount: delta } }).exec();
  }
}
