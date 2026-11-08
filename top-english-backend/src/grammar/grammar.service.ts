/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ bài học ngữ pháp (GrammarLessons), tự động gieo dữ liệu mẫu và theo dõi tiến độ
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
import { GrammarLesson, GrammarLessonDocument } from './schemas/grammar-lesson.schema';
import {
  UserGrammarProgress,
  UserGrammarProgressDocument,
} from './schemas/user-grammar-progress.schema';
import { CreateGrammarLessonDto } from './dto/create-grammar-lesson.dto';
import { UpdateGrammarLessonDto } from './dto/update-grammar-lesson.dto';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class GrammarService implements OnModuleInit {
  private readonly logger = new Logger(GrammarService.name);

  constructor(
    @InjectModel(GrammarLesson.name)
    private readonly lessonModel: Model<GrammarLessonDocument>,
    @InjectModel(UserGrammarProgress.name)
    private readonly progressModel: Model<UserGrammarProgressDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự động khởi tạo dữ liệu bài giảng ngữ pháp mẫu chuẩn CEFR nếu collection trống
   */
  async onModuleInit() {
    const count = await this.lessonModel.countDocuments();
    if (count === 0) {
      const admin = await this.userModel.findOne({ role: Role.ADMIN });
      if (!admin) return;

      const sampleLessons: Partial<GrammarLesson>[] = [
        {
          title: 'Thì Hiện Tại Đơn (Present Simple Tense)',
          slug: 'present-simple-tense',
          level: EnglishLevel.A1,
          category: 'Tenses',
          summary: 'Thì cơ bản nhất diễn tả thói quen lặp đi lặp lại hàng ngày, sự thật hiển nhiên và chân lý.',
          formula: {
            positive: 'S + V(s/es) + O  |  (To be: S + am/is/are + Adj/Noun)',
            negative: 'S + do/does not + V(bare) + O  |  (To be: S + am/is/are not + Adj/Noun)',
            question: 'Do/Does + S + V(bare) + O?  |  (To be: Am/Is/Are + S + Adj/Noun?)',
          },
          usage: [
            'Diễn tả chân lý khoa học hoặc sự thật hiển nhiên (The sun rises in the east).',
            'Diễn tả thói quen, phong cách sống lặp đi lặp lại ở hiện tại (I drink coffee every morning).',
            'Diễn tả lịch trình tàu xe, máy bay hoặc thời gian biểu cố định (The train departs at 6:00 AM).',
          ],
          signals: ['always', 'usually', 'often', 'sometimes', 'never', 'every day', 'once a week'],
          examples: [
            {
              en: 'She drinks green tea every morning.',
              vi: 'Cô ấy uống trà xanh vào mỗi buổi sáng.',
              note: "Chủ ngữ 'She' là ngôi thứ 3 số ít, động từ thêm 's'",
            },
            {
              en: 'Water boils at 100 degrees Celsius.',
              vi: 'Nước sôi ở nhiệt độ 100 độ C.',
              note: 'Sự thật khoa học hiển nhiên',
            },
            {
              en: 'They do not live in this neighborhood.',
              vi: 'Họ không sống ở khu dân cư này.',
              note: "Phủ định mượn trợ động từ 'do not'",
            },
          ],
          commonMistakes: [
            {
              wrong: 'He go to school by bus every day.',
              correct: 'He goes to school by bus every day.',
              reason: "Chủ ngữ 'He' (ngôi 3 số ít), động từ kết thúc bằng 'o' phải thêm '-es'.",
            },
            {
              wrong: "She doesn't likes sweet dessert.",
              correct: "She doesn't like sweet dessert.",
              reason: "Sau trợ động từ 'doesn't', động từ chính phải ở dạng nguyên mẫu không 'to'.",
            },
          ],
          content: `### Giới thiệu thì Hiện Tại Đơn
Thì Hiện Tại Đơn (Present Simple) là nền tảng cốt lõi của ngữ pháp tiếng Anh. Nó giúp bạn mô tả bản thân, thói quen và các quy luật tự nhiên.

#### Quy tắc thêm S/ES cho động từ ngôi thứ 3 số ít (He / She / It):
- Thêm **-es** sau động từ kết thúc bằng: *-s, -ss, -sh, -ch, -x, -z, -o* (ví dụ: *watch -> watches, go -> goes*).
- Động từ kết thúc bằng *phụ âm + y*: đổi thành *-ies* (ví dụ: *study -> studies*).
- Hầu hết các động từ còn lại: chỉ cần thêm **-s** (ví dụ: *work -> works, speak -> speaks*).`,
          order: 1,
          createdBy: admin._id,
        },
        {
          title: 'Thì Quá Khứ Đơn (Past Simple Tense)',
          slug: 'past-simple-tense',
          level: EnglishLevel.A2,
          category: 'Tenses',
          summary: 'Diễn tả hành động hoặc chuỗi sự việc đã xảy ra và chấm dứt hoàn toàn trong quá khứ.',
          formula: {
            positive: 'S + V2/V-ed + O  |  (To be: S + was/were + Adj/Noun)',
            negative: 'S + did not + V(bare) + O  |  (To be: S + was/were not + Adj/Noun)',
            question: 'Did + S + V(bare) + O?  |  (To be: Was/Were + S + Adj/Noun?)',
          },
          usage: [
            'Hành động đã xảy ra và kết thúc dứt điểm tại một thời điểm xác định trong quá khứ.',
            'Chuỗi các hành động liên tiếp xảy ra trong một câu chuyện quá khứ.',
          ],
          signals: ['yesterday', 'ago', 'last night', 'last week', 'in 2019', 'when I was young'],
          examples: [
            {
              en: 'We visited Paris during our summer vacation last year.',
              vi: 'Chúng tôi đã đi thăm Paris trong kỳ nghỉ hè năm ngoái.',
              note: "Động từ 'visit' thêm đuôi '-ed'",
            },
            {
              en: 'He woke up, ate breakfast, and left for work.',
              vi: 'Anh ấy thức dậy, ăn sáng rồi lên đường đi làm.',
              note: 'Chuỗi hành động quá khứ liên tiếp',
            },
          ],
          commonMistakes: [
            {
              wrong: "I didn't saw him at the conference yesterday.",
              correct: "I didn't see him at the conference yesterday.",
              reason: "Sau trợ động từ quá khứ 'didn't', động từ quay về nguyên mẫu 'see'.",
            },
          ],
          content: `### Phân biệt động từ có quy tắc và bất quy tắc
- **Động từ có quy tắc:** thêm đuôi *-ed* (ví dụ: *play -> played, clean -> cleaned*).
- **Động từ bất quy tắc:** tra cứu bảng 360 động từ bất quy tắc (ví dụ: *go -> went, see -> saw, buy -> bought*).`,
          order: 2,
          createdBy: admin._id,
        },
        {
          title: 'Thì Hiện Tại Hoàn Thành (Present Perfect Tense)',
          slug: 'present-perfect-tense',
          level: EnglishLevel.B1,
          category: 'Tenses',
          summary: 'Cầu nối giữa quá khứ và hiện tại: diễn tả trải nghiệm hoặc hành động có kết quả ảnh hưởng đến hiện tại.',
          formula: {
            positive: 'S + have/has + V3/V-ed + O',
            negative: 'S + have/has not + V3/V-ed + O',
            question: 'Have/Has + S + V3/V-ed + O?',
          },
          usage: [
            'Hành động xảy ra trong quá khứ nhưng để lại kết quả rõ ràng ở hiện tại.',
            'Diễn tả kinh nghiệm hoặc trải nghiệm sống từ trước tới nay (ever, never).',
            'Hành động bắt đầu trong quá khứ và vẫn đang tiếp diễn ở hiện tại (since, for).',
          ],
          signals: ['already', 'yet', 'just', 'ever', 'never', 'since', 'for', 'recently', 'so far'],
          examples: [
            {
              en: 'I have lived in Da Nang for five years.',
              vi: 'Tôi đã sống ở Đà Nẵng được 5 năm (và hiện tại vẫn đang sống ở đây).',
              note: "Dùng 'for' với khoảng thời gian",
            },
            {
              en: 'Have you ever traveled overseas?',
              vi: 'Bạn đã từng đi du lịch nước ngoài bao giờ chưa?',
              note: "Hỏi về trải nghiệm với 'ever'",
            },
          ],
          commonMistakes: [
            {
              wrong: 'I have met him yesterday.',
              correct: 'I met him yesterday.',
              reason: "Có mốc thời gian quá khứ xác định 'yesterday' thì bắt buộc dùng Thì Quá Khứ Đơn, không dùng Hiện Tại Hoàn Thành.",
            },
          ],
          content: `### Phân biệt "Since" và "For"
- **Since + Mốc thời gian bắt đầu:** *since 2018, since yesterday, since 8:00 AM*.
- **For + Khoảng thời gian kéo dài:** *for 3 days, for 5 years, for two hours*.`,
          order: 3,
          createdBy: admin._id,
        },
        {
          title: 'Câu Điều Kiện Loại 1 (First Conditional)',
          slug: 'first-conditional',
          level: EnglishLevel.A2,
          category: 'Conditionals',
          summary: 'Diễn tả điều kiện có thật hoặc rất có thể xảy ra ở hiện tại hoặc tương lai kèm theo kết quả.',
          formula: {
            positive: 'If + S + V(present simple), S + will + V(bare)',
            negative: 'If + S + do/does not + V, S + will not + V(bare)',
            question: 'What will + S + do if + S + V(present simple)?',
          },
          usage: [
            'Diễn tả dự đoán, cảnh báo hoặc lời hứa có khả năng thành hiện thực trong tương lai.',
          ],
          signals: ['If', 'Unless (= If... not)', 'as soon as', 'when', 'provided that'],
          examples: [
            {
              en: 'If it rains tomorrow, we will study at home.',
              vi: 'Nếu ngày mai trời mưa, chúng tôi sẽ học ở nhà.',
              note: 'Mệnh đề If ở hiện tại đơn, mệnh đề chính dùng will',
            },
            {
              en: 'Unless you hurry up, you will miss the morning train.',
              vi: 'Trừ khi bạn nhanh chân lên, nếu không bạn sẽ lỡ chuyến tàu sáng.',
              note: 'Unless mang nghĩa phủ định (If you do not hurry up)',
            },
          ],
          commonMistakes: [
            {
              wrong: 'If it will rain tomorrow, I will stay inside.',
              correct: 'If it rains tomorrow, I will stay inside.',
              reason: "Tuyệt đối không dùng 'will' trong mệnh đề chứa 'If'. Mệnh đề 'If' phải dùng Hiện Tại Đơn.",
            },
          ],
          content: `### Lưu ý quan trọng về vị trí mệnh đề:
- Nếu mệnh đề **If** đứng đầu câu: phải có dấu phẩy ngăn cách (*If it rains, we will stay at home*).
- Nếu mệnh đề chính đứng đầu câu: không cần dấu phẩy (*We will stay at home if it rains*).`,
          order: 4,
          createdBy: admin._id,
        },
      ];

      await this.lessonModel.insertMany(sampleLessons);
      this.logger.log(`🌱 Đã tự động khởi tạo ${sampleLessons.length} bài học ngữ pháp mẫu (A1, A2, B1)`);
    }
  }

  /**
   * Sinh slug chuẩn SEO từ tiêu đề
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
   * Lấy danh sách các chuyên mục ngữ pháp và số lượng bài học tương ứng
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const result = await this.lessonModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { category: 1 } },
    ]);
    return result;
  }

  /**
   * Lấy danh sách bài học ngữ pháp theo bộ lọc
   */
  async findAll(query?: {
    level?: EnglishLevel;
    category?: string;
    search?: string;
    userId?: string;
  }): Promise<any[]> {
    const filter: Record<string, any> = {};

    if (query?.level) {
      filter.level = query.level;
    }

    if (query?.category) {
      filter.category = query.category;
    }

    if (query?.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { summary: searchRegex }];
    }

    const lessons = await this.lessonModel
      .find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ order: 1, createdAt: 1 })
      .exec();

    // Nếu người dùng đã đăng nhập, gắn thêm trạng thái isCompleted
    if (query?.userId && Types.ObjectId.isValid(query.userId)) {
      const completedProgress = await this.progressModel.find({
        userId: new Types.ObjectId(query.userId),
        isCompleted: true,
      });

      const completedIds = new Set(completedProgress.map((p) => p.lessonId.toString()));

      return lessons.map((l) => ({
        ...l.toObject(),
        isCompleted: completedIds.has(l._id.toString()),
      }));
    }

    return lessons;
  }

  /**
   * Xem chi tiết bài học ngữ pháp theo ID hoặc Slug
   */
  async findByIdOrSlug(idOrSlug: string, userId?: string): Promise<any> {
    let lesson: GrammarLessonDocument | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      lesson = await this.lessonModel.findById(idOrSlug).populate('createdBy', 'fullName email').exec();
    }

    if (!lesson) {
      lesson = await this.lessonModel.findOne({ slug: idOrSlug }).populate('createdBy', 'fullName email').exec();
    }

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học ngữ pháp với định danh "${idOrSlug}"`);
    }

    let isCompleted = false;
    if (userId && Types.ObjectId.isValid(userId)) {
      const prog = await this.progressModel.findOne({
        userId: new Types.ObjectId(userId),
        lessonId: lesson._id,
        isCompleted: true,
      });
      isCompleted = !!prog;
    }

    return {
      ...lesson.toObject(),
      isCompleted,
    };
  }

  /**
   * Tạo bài học ngữ pháp mới
   */
  async create(createDto: CreateGrammarLessonDto, userId: string): Promise<GrammarLessonDocument> {
    const slug = createDto.slug || this.generateSlug(createDto.title);

    const existingSlug = await this.lessonModel.findOne({ slug });
    if (existingSlug) {
      throw new BadRequestException(`Slug "${slug}" đã tồn tại trên hệ thống`);
    }

    const lesson = new this.lessonModel({
      ...createDto,
      slug,
      createdBy: new Types.ObjectId(userId),
    });

    return lesson.save();
  }

  /**
   * Cập nhật thông tin bài học ngữ pháp
   */
  async update(id: string, updateDto: UpdateGrammarLessonDto): Promise<GrammarLessonDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
    }

    if (updateDto.slug) {
      const existing = await this.lessonModel.findOne({
        slug: updateDto.slug,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new BadRequestException(`Slug "${updateDto.slug}" đã bị trùng lặp`);
      }
    }

    const updated = await this.lessonModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy bài học ngữ pháp có ID ${id}`);
    }

    return updated;
  }

  /**
   * Xóa bài học ngữ pháp
   */
  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
    }

    const lesson = await this.lessonModel.findByIdAndDelete(id).exec();
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học ngữ pháp có ID ${id}`);
    }

    // Xóa tiến độ bài học của học viên liên quan
    await this.progressModel.deleteMany({ lessonId: new Types.ObjectId(id) });

    return { deleted: true, message: `Đã xóa thành công bài học "${lesson.title}"` };
  }

  /**
   * Đánh dấu hoặc hủy đánh dấu đã hoàn thành bài học (Thưởng 20 XP khi hoàn thành lần đầu)
   */
  async toggleProgress(
    lessonId: string,
    userId: string,
  ): Promise<{ isCompleted: boolean; xpEarned: number; message: string }> {
    if (!Types.ObjectId.isValid(lessonId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID bài học hoặc học viên không hợp lệ');
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học ngữ pháp');
    }

    const existingProgress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
      lessonId: new Types.ObjectId(lessonId),
    });

    if (existingProgress && existingProgress.isCompleted) {
      // Hủy trạng thái hoàn thành
      await this.progressModel.findByIdAndDelete(existingProgress._id);
      return {
        isCompleted: false,
        xpEarned: 0,
        message: 'Đã hủy đánh dấu hoàn thành bài học',
      };
    } else {
      // Đánh dấu hoàn thành và thưởng +20 XP
      await this.progressModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), lessonId: new Types.ObjectId(lessonId) },
        { isCompleted: true, completedAt: new Date() },
        { upsert: true, new: true },
      );

      // Tăng điểm XP cho học viên
      await this.userModel.findByIdAndUpdate(userId, { $inc: { totalXP: 20 } });

      return {
        isCompleted: true,
        xpEarned: 20,
        message: 'Chúc mừng bạn đã hoàn thành bài học (+20 XP)!',
      };
    }
  }

  /**
   * Lấy tổng quan tiến độ học ngữ pháp của học viên
   */
  async getUserProgress(userId: string): Promise<{
    completedCount: number;
    totalLessons: number;
    completionPercentage: number;
    completedLessonIds: string[];
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID học viên không hợp lệ');
    }

    const totalLessons = await this.lessonModel.countDocuments();
    const completedList = await this.progressModel.find({
      userId: new Types.ObjectId(userId),
      isCompleted: true,
    });

    const completedCount = completedList.length;
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      completedCount,
      totalLessons,
      completionPercentage,
      completedLessonIds: completedList.map((p) => p.lessonId.toString()),
    };
  }
}
