/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ bài học ngữ pháp (GrammarLessons), tự động gieo dữ liệu mẫu và theo dõi tiến độ
 */

import {
  BadRequestException,
  ForbiddenException,
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
import { AssignGrammarClassroomsDto } from './dto/assign-grammar-classrooms.dto';
import { SubmitGrammarPracticeDto } from './dto/submit-grammar-practice.dto';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { Classroom, ClassroomDocument } from '../classrooms/schemas/classroom.schema';
import {
  Assignment,
  AssignmentDocument,
  AssignmentType,
} from '../classrooms/schemas/assignment.schema';
import {
  Submission,
  SubmissionDocument,
  SubmissionStatus,
} from '../classrooms/schemas/submission.schema';

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
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<ClassroomDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
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
   * Sinh slug chuẩn SEO không trùng lặp
   */
  private async generateUniqueSlug(text: string, excludeId?: string): Promise<string> {
    const base = this.generateSlug(text) || `grammar-lesson-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    while (true) {
      const query: Record<string, any> = { slug: candidate };
      if (excludeId && Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }
      const exists = await this.lessonModel.exists(query);
      if (!exists) return candidate;
      candidate = `${base}-${suffix++}`;
    }
  }

  private isStaffRole(role?: string): boolean {
    return role === Role.ADMIN || role === Role.TEACHER;
  }

  /**
   * Lấy danh sách các chuyên mục ngữ pháp và số lượng bài học tương ứng
   */
  async getCategories(role?: string): Promise<{ category: string; count: number }[]> {
    const matchStage = this.isStaffRole(role)
      ? []
      : [{ $match: { status: { $ne: 'draft' } } }];
    const result = await this.lessonModel.aggregate([
      ...matchStage,
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
    role?: string;
  }): Promise<any[]> {
    const filter: Record<string, any> = {};

    if (!this.isStaffRole(query?.role)) {
      filter.status = { $ne: 'draft' };
    }

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

    // Nếu người dùng đã đăng nhập, gắn thêm trạng thái isCompleted & bestScore
    if (query?.userId && Types.ObjectId.isValid(query.userId)) {
      const userProgresses = await this.progressModel.find({
        userId: new Types.ObjectId(query.userId),
      });

      const progressMap = new Map(
        userProgresses.map((p) => [p.lessonId.toString(), p]),
      );

      return lessons.map((l) => {
        const prog = progressMap.get(l._id.toString());
        return {
          ...l.toObject(),
          status: l.status || 'published',
          isCompleted: !!prog?.isCompleted,
          bestScore: prog?.bestScore ?? null,
          practiceAttempts: prog?.practiceAttempts ?? 0,
        };
      });
    }

    return lessons.map((l) => ({
      ...l.toObject(),
      status: l.status || 'published',
    }));
  }

  /**
   * Xem chi tiết bài học ngữ pháp theo ID hoặc Slug
   */
  async findByIdOrSlug(idOrSlug: string, userId?: string, role?: string): Promise<any> {
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

    if (lesson.status === 'draft' && !this.isStaffRole(role)) {
      throw new NotFoundException('Bài học này đang ở chế độ nháp và chưa được mở khóa');
    }

    let isCompleted = false;
    let practiceSummary: {
      bestScore: number | null;
      lastScore: number | null;
      practiceAttempts: number;
    } = {
      bestScore: null,
      lastScore: null,
      practiceAttempts: 0,
    };

    if (userId && Types.ObjectId.isValid(userId)) {
      const prog = await this.progressModel.findOne({
        userId: new Types.ObjectId(userId),
        lessonId: lesson._id,
      });
      isCompleted = !!prog?.isCompleted;
      if (prog) {
        practiceSummary = {
          bestScore: prog.bestScore ?? null,
          lastScore: prog.lastScore ?? null,
          practiceAttempts: prog.practiceAttempts ?? 0,
        };
      }
    }

    return {
      ...lesson.toObject(),
      status: lesson.status || 'published',
      isCompleted,
      ...practiceSummary,
    };
  }

  /**
   * Tạo bài học ngữ pháp mới
   */
  async create(createDto: CreateGrammarLessonDto, userId: string): Promise<GrammarLessonDocument> {
    const slug = createDto.slug?.trim()
      ? createDto.slug.trim().toLowerCase()
      : await this.generateUniqueSlug(createDto.title);

    const existingSlug = await this.lessonModel.findOne({ slug });
    if (existingSlug) {
      throw new BadRequestException(`Slug "${slug}" đã tồn tại trên hệ thống`);
    }

    let order = createDto.order;
    if (typeof order !== 'number' || order <= 0) {
      const lastLesson = await this.lessonModel.findOne().sort({ order: -1 }).select('order').lean();
      order = (lastLesson?.order || 0) + 1;
    }

    const lesson = new this.lessonModel({
      ...createDto,
      slug,
      order,
      status: createDto.status || 'published',
      createdBy: new Types.ObjectId(userId),
    });

    return lesson.save();
  }

  /**
   * Nhân bản một bài học ngữ pháp thành bản nháp mới
   */
  async duplicate(id: string, userId: string): Promise<GrammarLessonDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
    }

    const source = await this.lessonModel.findById(id).lean();
    if (!source) {
      throw new NotFoundException(`Không tìm thấy bài học ngữ pháp có ID ${id}`);
    }

    const newTitle = `${source.title} (Bản sao)`;
    const newSlug = await this.generateUniqueSlug(newTitle);
    const lastLesson = await this.lessonModel.findOne().sort({ order: -1 }).select('order').lean();

    const cloned = new this.lessonModel({
      title: newTitle,
      slug: newSlug,
      level: source.level,
      category: source.category,
      status: 'draft',
      summary: source.summary || '',
      formula: source.formula || {},
      usage: source.usage || [],
      signals: source.signals || [],
      examples: source.examples || [],
      commonMistakes: source.commonMistakes || [],
      exercises: source.exercises || [],
      content: source.content || '',
      order: (lastLesson?.order || 0) + 1,
      createdBy: new Types.ObjectId(userId),
    });

    return cloned.save();
  }

  /**
   * Đổi trạng thái Nháp / Đã xuất bản (Mở khóa)
   */
  async updateStatus(
    id: string,
    status: 'draft' | 'published',
  ): Promise<GrammarLessonDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID bài học không hợp lệ');
    }

    const updated = await this.lessonModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy bài học ngữ pháp có ID ${id}`);
    }

    return updated;
  }

  /**
   * Kéo thả sắp xếp lại thứ tự Lộ trình bài #1, #2, #3...
   */
  async reorder(orderedIds: string[]): Promise<{ updatedCount: number }> {
    const validIds = orderedIds.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new BadRequestException('Danh sách thứ tự bài học không hợp lệ');
    }

    const ops = validIds.map((id, idx) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { order: idx + 1 } },
      },
    }));

    await this.lessonModel.bulkWrite(ops);
    return { updatedCount: ops.length };
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

    const totalLessons = await this.lessonModel.countDocuments({ status: { $ne: 'draft' } });
    const completedList = await this.progressModel.find({
      userId: new Types.ObjectId(userId),
      isCompleted: true,
    });

    const completedCount = completedList.length;
    const completionPercentage =
      totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

    return {
      completedCount,
      totalLessons,
      completionPercentage,
      completedLessonIds: completedList.map((p) => p.lessonId.toString()),
    };
  }

  /**
   * Thống kê giảng dạy đầu trang dành cho Giáo viên / Admin
   */
  async getTeacherStats(userId: string, role: string): Promise<{
    totalLessons: number;
    publishedCount: number;
    draftCount: number;
    avgCompletionRate: number;
    assignedCount: number;
    hardestLesson: {
      _id: string;
      title: string;
      slug: string;
      avgWrongRate: number;
      attemptsCount: number;
    } | null;
  }> {
    const lessons = await this.lessonModel.find().select('_id title slug status').lean();
    const totalLessons = lessons.length;
    const publishedLessons = lessons.filter((l) => l.status !== 'draft');
    const publishedCount = publishedLessons.length;
    const draftCount = totalLessons - publishedCount;

    const studentCount = await this.userModel.countDocuments({ role: Role.STUDENT, isActive: true });
    const completedCount = await this.progressModel.countDocuments({ isCompleted: true });

    const denom = Math.max(1, publishedCount * Math.max(1, studentCount));
    const avgCompletionRate =
      publishedCount > 0 && studentCount > 0
        ? Math.min(100, Math.round((completedCount / denom) * 100))
        : 0;

    const assignmentFilter: Record<string, any> = {
      type: AssignmentType.GRAMMAR,
      isActive: true,
    };
    if (role !== Role.ADMIN && Types.ObjectId.isValid(userId)) {
      assignmentFilter.teacher = new Types.ObjectId(userId);
    }
    const assignedCount = await this.assignmentModel.countDocuments(assignmentFilter);

    // Bài có tỷ lệ làm sai cao nhất (dựa trên bestScore / lastScore trong progress)
    const practiceAgg = await this.progressModel.aggregate([
      { $match: { lastScore: { $ne: null } } },
      {
        $group: {
          _id: '$lessonId',
          avgScore: { $avg: '$lastScore' },
          attemptsCount: { $sum: '$practiceAttempts' },
        },
      },
      { $sort: { avgScore: 1 } },
    ]);

    let hardestLesson: {
      _id: string;
      title: string;
      slug: string;
      avgWrongRate: number;
      attemptsCount: number;
    } | null = null;

    if (practiceAgg.length > 0) {
      const lessonMap = new Map(lessons.map((l) => [l._id.toString(), l]));
      for (const row of practiceAgg) {
        const matched = lessonMap.get(row._id.toString());
        if (matched) {
          hardestLesson = {
            _id: matched._id.toString(),
            title: matched.title,
            slug: matched.slug,
            avgWrongRate: Math.max(0, Math.round(100 - (row.avgScore || 0))),
            attemptsCount: row.attemptsCount || 1,
          };
          break;
        }
      }
    }

    return {
      totalLessons,
      publishedCount,
      draftCount,
      avgCompletionRate,
      assignedCount,
      hardestLesson,
    };
  }

  /**
   * Giao nhanh bài học ngữ pháp cho 1 hoặc nhiều lớp học (tạo Assignment gắn deadline)
   */
  async assignToClassrooms(
    lessonId: string,
    teacherId: string,
    role: string,
    dto: AssignGrammarClassroomsDto,
  ): Promise<{ assignedCount: number; classroomNames: string[] }> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('ID bài học ngữ pháp không hợp lệ');
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học ngữ pháp');
    }

    const dueDate = new Date(dto.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Ngày hạn chót không hợp lệ');
    }

    const teacherObjId = new Types.ObjectId(teacherId);
    const classroomNames: string[] = [];

    for (const cid of dto.classroomIds) {
      const classroom = await this.classroomModel.findById(cid);
      if (!classroom) continue;

      if (role !== Role.ADMIN && classroom.teacher.toString() !== teacherId) {
        throw new ForbiddenException(`Bạn không có quyền giao bài cho lớp "${classroom.name}"`);
      }

      await this.assignmentModel.findOneAndUpdate(
        {
          classroom: classroom._id,
          type: AssignmentType.GRAMMAR,
          targetId: lesson._id.toString(),
        },
        {
          $set: {
            title: `Ngữ pháp: ${lesson.title}`,
            description:
              dto.description?.trim() ||
              `Đọc lý thuyết và hoàn thành bài tập thực hành bài "${lesson.title}".`,
            targetTitle: lesson.title,
            teacher: teacherObjId,
            dueDate,
            maxScore: dto.maxScore ?? 100,
            isActive: true,
          },
        },
        { upsert: true, new: true },
      );

      classroomNames.push(classroom.name);
    }

    if (classroomNames.length === 0) {
      throw new BadRequestException('Không tìm thấy lớp học hợp lệ để giao bài');
    }

    // Tự động mở khóa bài học nếu đang ở nháp để học sinh vào học được ngay
    if (lesson.status === 'draft') {
      await this.lessonModel.findByIdAndUpdate(lesson._id, { $set: { status: 'published' } });
    }

    return {
      assignedCount: classroomNames.length,
      classroomNames,
    };
  }

  /**
   * Xem tiến độ đọc bài & điểm thực hành của học sinh theo từng lớp học cho một bài ngữ pháp
   */
  async getLessonClassProgress(
    lessonId: string,
    teacherId: string,
    role: string,
  ): Promise<{
    lessonId: string;
    lessonTitle: string;
    classrooms: Array<{
      classroomId: string;
      name: string;
      code: string;
      isAssigned: boolean;
      dueDate: Date | null;
      completedStudents: number;
      totalStudents: number;
      avgScore: number | null;
      students: Array<{
        studentId: string;
        fullName: string;
        email: string;
        avatar: string | null;
        isCompleted: boolean;
        completedAt: Date | null;
        practiceAttempts: number;
        bestScore: number | null;
        lastScore: number | null;
        lastPracticedAt: Date | null;
      }>;
    }>;
  }> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('ID bài học ngữ pháp không hợp lệ');
    }

    const lesson = await this.lessonModel.findById(lessonId).lean();
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học ngữ pháp');
    }

    const classroomQuery: Record<string, any> = { isActive: true };
    if (role !== Role.ADMIN) {
      classroomQuery.teacher = new Types.ObjectId(teacherId);
    }

    const classrooms = await this.classroomModel
      .find(classroomQuery)
      .populate('students', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .lean();

    const assignments = await this.assignmentModel
      .find({
        classroom: { $in: classrooms.map((c) => c._id) },
        type: AssignmentType.GRAMMAR,
        targetId: lesson._id.toString(),
        isActive: true,
      })
      .lean();

    const assignmentByClass = new Map(
      assignments.map((a) => [a.classroom.toString(), a]),
    );

    const allStudentIds = Array.from(
      new Set(
        classrooms.flatMap((c: any) =>
          (c.students || []).map((s: any) => s._id.toString()),
        ),
      ),
    ).map((id) => new Types.ObjectId(id));

    const progresses = await this.progressModel
      .find({
        lessonId: lesson._id,
        userId: { $in: allStudentIds },
      })
      .lean();

    const progressByUser = new Map(
      progresses.map((p) => [p.userId.toString(), p]),
    );

    const resultClassrooms = classrooms.map((c: any) => {
      const assignment = assignmentByClass.get(c._id.toString());
      const students = (c.students || []).map((st: any) => {
        const prog = progressByUser.get(st._id.toString());
        return {
          studentId: st._id.toString(),
          fullName: st.fullName,
          email: st.email,
          avatar: st.avatar || null,
          isCompleted: !!prog?.isCompleted,
          completedAt: prog?.completedAt || null,
          practiceAttempts: prog?.practiceAttempts || 0,
          bestScore: prog?.bestScore ?? null,
          lastScore: prog?.lastScore ?? null,
          lastPracticedAt: prog?.lastPracticedAt || null,
        };
      });

      const completedStudents = students.filter((s: any) => s.isCompleted).length;
      const scored = students.filter((s: any) => typeof s.bestScore === 'number');
      const avgScore =
        scored.length > 0
          ? Math.round(
              scored.reduce((acc: number, s: any) => acc + (s.bestScore || 0), 0) /
                scored.length,
            )
          : null;

      return {
        classroomId: c._id.toString(),
        name: c.name,
        code: c.code,
        isAssigned: !!assignment,
        dueDate: assignment?.dueDate || null,
        completedStudents,
        totalStudents: students.length,
        avgScore,
        students,
      };
    });

    return {
      lessonId: lesson._id.toString(),
      lessonTitle: lesson.title,
      classrooms: resultClassrooms,
    };
  }

  /**
   * Học viên nộp bài tập thực hành cuối bài ngữ pháp
   */
  async submitPractice(
    lessonId: string,
    userId: string,
    dto: SubmitGrammarPracticeDto,
  ): Promise<{
    score: number;
    correctCount: number;
    totalCount: number;
    bestScore: number;
    xpEarned: number;
    results: Array<{
      questionIndex: number;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  }> {
    if (!Types.ObjectId.isValid(lessonId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID bài học hoặc học viên không hợp lệ');
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học ngữ pháp');
    }

    const exercises = lesson.exercises || [];
    if (exercises.length === 0) {
      throw new BadRequestException('Bài học này chưa có câu hỏi bài tập thực hành');
    }

    const answerMap = new Map(
      (dto.answers || []).map((a) => [a.questionIndex, String(a.answer || '').trim()]),
    );

    let correctCount = 0;
    const wrongIndexes: number[] = [];
    const results = exercises.map((ex, idx) => {
      const userAnswer = answerMap.get(idx) || '';
      const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedCorrect = String(ex.correctAnswer || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      const isCorrect = normalizedUser.length > 0 && normalizedUser === normalizedCorrect;
      if (isCorrect) {
        correctCount++;
      } else {
        wrongIndexes.push(idx);
      }
      return {
        questionIndex: idx,
        userAnswer,
        correctAnswer: ex.correctAnswer,
        isCorrect,
        explanation: ex.explanation || '',
      };
    });

    const totalCount = exercises.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const userObjId = new Types.ObjectId(userId);

    const existing = await this.progressModel.findOne({
      userId: userObjId,
      lessonId: lesson._id,
    });

    const prevBest = existing?.bestScore ?? 0;
    const bestScore = Math.max(prevBest, score);
    const wasAlreadyCompleted = !!existing?.isCompleted;
    const shouldMarkCompleted = wasAlreadyCompleted || score >= 50;
    let xpEarned = 0;

    if (!wasAlreadyCompleted && shouldMarkCompleted) {
      xpEarned = 20;
      await this.userModel.findByIdAndUpdate(userId, { $inc: { totalXP: 20 } });
    }

    await this.progressModel.findOneAndUpdate(
      { userId: userObjId, lessonId: lesson._id },
      {
        $set: {
          isCompleted: shouldMarkCompleted,
          completedAt: existing?.completedAt || (shouldMarkCompleted ? new Date() : null),
          lastScore: score,
          bestScore,
          lastCorrectCount: correctCount,
          lastTotalCount: totalCount,
          lastPracticedAt: new Date(),
          wrongQuestionIndexes: wrongIndexes,
        },
        $inc: { practiceAttempts: 1 },
      },
      { upsert: true, new: true },
    );

    // Đồng bộ điểm vào Submission nếu bài học được giao qua lớp học (AssignmentType.GRAMMAR)
    const studentClassrooms = await this.classroomModel
      .find({ students: userObjId, isActive: true })
      .select('_id')
      .lean();

    if (studentClassrooms.length > 0) {
      const classIds = studentClassrooms.map((c) => c._id);
      const assignments = await this.assignmentModel.find({
        classroom: { $in: classIds },
        type: AssignmentType.GRAMMAR,
        targetId: lesson._id.toString(),
        isActive: true,
      });

      for (const assign of assignments) {
        const scaledScore = Math.round((score / 100) * (assign.maxScore || 100));
        await this.submissionModel.findOneAndUpdate(
          { assignment: assign._id, student: userObjId },
          {
            $set: {
              classroom: assign.classroom,
              status: SubmissionStatus.GRADED,
              score: scaledScore,
              content: `Hoàn thành thực hành ngữ pháp (${correctCount}/${totalCount} câu đúng - ${score}%)`,
              submittedAt: new Date(),
              gradedAt: new Date(),
            },
          },
          { upsert: true, new: true },
        );
      }
    }

    return {
      score,
      correctCount,
      totalCount,
      bestScore,
      xpEarned,
      results,
    };
  }
}
