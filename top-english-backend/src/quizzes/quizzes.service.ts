/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ đề thi, câu hỏi trắc nghiệm, chấm điểm tự động và thưởng điểm XP
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
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { Question, QuestionDocument } from './schemas/question.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from './schemas/quiz-submission.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizType } from './enums/quiz-type.enum';
import { QuestionType } from './enums/question-type.enum';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import {
  GrammarLesson,
  GrammarLessonDocument,
} from '../grammar/schemas/grammar-lesson.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class QuizzesService implements OnModuleInit {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(QuizSubmission.name)
    private readonly submissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(GrammarLesson.name)
    private readonly lessonModel: Model<GrammarLessonDocument>,
  ) {}

  /**
   * Tự động khởi tạo dữ liệu mẫu 2 đề thi kiểm tra kiến thức (Từ vựng & Ngữ pháp)
   */
  async onModuleInit() {
    const quizCount = await this.quizModel.countDocuments();
    if (quizCount === 0) {
      const admin = await this.userModel.findOne({ role: Role.ADMIN });
      if (!admin) return;

      const techTopic = await this.topicModel.findOne({ slug: 'technology-and-ai' });
      const presentSimpleLesson = await this.lessonModel.findOne({ slug: 'present-simple-tense' });

      // 1. Tạo Đề 1: Từ vựng Công nghệ & AI
      const vocabQuiz = new this.quizModel({
        title: 'Kiểm Tra Từ Vựng Công Nghệ & Trí Tuệ Nhân Tạo',
        description: 'Đánh giá khả năng hiểu nghĩa, cách dùng các thuật ngữ công nghệ thông tin và AI.',
        type: QuizType.VOCABULARY,
        level: EnglishLevel.B1,
        topicId: techTopic ? techTopic._id : undefined,
        durationMinutes: 10,
        passingScore: 70,
        totalQuestions: 5,
        createdBy: admin._id,
      });
      await vocabQuiz.save();

      const vocabQuestions = [
        {
          quizId: vocabQuiz._id,
          questionText: 'What is an "Algorithm" in computer science?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            'A step-by-step procedure for solving a problem',
            'A type of physical computer monitor',
            'A brand of wireless gaming keyboard',
            'An electrical cable connecting devices',
          ],
          correctAnswer: 'A step-by-step procedure for solving a problem',
          explanation: '"Algorithm" có nghĩa là thuật toán, quy trình từng bước rõ ràng để giải quyết vấn đề toán học hoặc điện toán.',
          order: 1,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Which word means "an organized collection of structured data stored electronically"?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Database', 'Cybercrime', 'Innovation', 'Itinerary'],
          correctAnswer: 'Database',
          explanation: '"Database" (Cơ sở dữ liệu) là tập hợp dữ liệu được tổ chức có cấu trúc và truy xuất trên máy tính.',
          order: 2,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Engineers write scripts to ________ (tự động hóa) repetitive build tasks.',
          type: QuestionType.FILL_IN_THE_BLANK,
          options: [],
          correctAnswer: 'automate',
          explanation: '"automate" (động từ) nghĩa là tự động hóa các tác vụ lặp đi lặp lại để tiết kiệm thời gian.',
          order: 3,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Criminal activities carried out by means of computers or the internet are known as ________.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Cybercrime', 'Accommodation', 'Routine', 'Leisure'],
          correctAnswer: 'Cybercrime',
          explanation: '"Cybercrime" nghĩa là tội phạm công nghệ cao, tấn công mạng hoặc đánh cắp dữ liệu trực tuyến.',
          order: 4,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'The process of translating an idea into a good or service that creates value is called ________.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Innovation', 'Departure', 'Commute', 'Chore'],
          correctAnswer: 'Innovation',
          explanation: '"Innovation" nghĩa là sự đổi mới, sáng chế mang lại giá trị thực tiễn.',
          order: 5,
        },
      ];

      await this.questionModel.insertMany(vocabQuestions);

      // 2. Tạo Đề 2: Ngữ pháp Các thì & Câu điều kiện
      const grammarQuiz = new this.quizModel({
        title: 'Trắc Nghiệm Các Thì & Câu Điều Kiện Cơ Bản',
        description: 'Kiểm tra nắm bắt thì Hiện Tại Đơn, Quá Khứ Đơn, Hiện Tại Hoàn Thành và Câu Điều Kiện Loại 1.',
        type: QuizType.GRAMMAR,
        level: EnglishLevel.A2,
        grammarLessonId: presentSimpleLesson ? presentSimpleLesson._id : undefined,
        durationMinutes: 10,
        passingScore: 70,
        totalQuestions: 5,
        createdBy: admin._id,
      });
      await grammarQuiz.save();

      const grammarQuestions = [
        {
          quizId: grammarQuiz._id,
          questionText: 'She ________ green tea every morning before going to work.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['drinks', 'drink', 'drinking', 'drank'],
          correctAnswer: 'drinks',
          explanation: 'Chủ ngữ ngôi thứ 3 số ít "She" trong thì Hiện Tại Đơn, động từ "drink" phải thêm "s" -> "drinks".',
          order: 1,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'We ________ Hanoi during our vacation last summer.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['visited', 'visit', 'have visited', 'visiting'],
          correctAnswer: 'visited',
          explanation: 'Có trạng từ chỉ thời gian quá khứ xác định "last summer", ta dùng thì Quá Khứ Đơn "visited".',
          order: 2,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'I have lived in this city ________ (trong/suốt) five years.',
          type: QuestionType.FILL_IN_THE_BLANK,
          options: [],
          correctAnswer: 'for',
          explanation: 'Trong thì Hiện Tại Hoàn Thành, dùng "for" với khoảng thời gian (for five years) và "since" với mốc thời gian.',
          order: 3,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'If it ________ tomorrow, we will stay at home.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['rains', 'will rain', 'rained', 'is raining'],
          correctAnswer: 'rains',
          explanation: 'Trong câu điều kiện loại 1 (First Conditional), mệnh đề "If" chia ở Hiện Tại Đơn, không dùng "will".',
          order: 4,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'He ________ wake up early yesterday because it was a public holiday.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ["didn't", "doesn't", "hasn't", "isn't"],
          correctAnswer: "didn't",
          explanation: 'Phủ định của thì Quá Khứ Đơn mượn trợ động từ "didn\'t" + động từ nguyên mẫu "wake".',
          order: 5,
        },
      ];

      await this.questionModel.insertMany(grammarQuestions);
      this.logger.log('🌱 Đã tự động khởi tạo 2 đề thi mẫu và 10 câu hỏi trắc nghiệm/điền từ');
    }
  }

  /**
   * Lấy danh sách đề thi theo bộ lọc
   */
  async findAll(query?: {
    type?: QuizType;
    level?: EnglishLevel;
    topicId?: string;
    grammarLessonId?: string;
    search?: string;
  }): Promise<QuizDocument[]> {
    const filter: Record<string, any> = {};

    if (query?.type) filter.type = query.type;
    if (query?.level) filter.level = query.level;
    if (query?.topicId && Types.ObjectId.isValid(query.topicId)) {
      filter.topicId = new Types.ObjectId(query.topicId);
    }
    if (query?.grammarLessonId && Types.ObjectId.isValid(query.grammarLessonId)) {
      filter.grammarLessonId = new Types.ObjectId(query.grammarLessonId);
    }
    if (query?.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    return this.quizModel
      .find(filter)
      .populate('topicId', 'title slug level')
      .populate('grammarLessonId', 'title slug level')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết đề thi
   */
  async findById(id: string): Promise<QuizDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'title slug level')
      .populate('grammarLessonId', 'title slug level')
      .populate('createdBy', 'fullName email')
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy đề thi có ID ${id}`);
    }

    return quiz;
  }

  /**
   * Lấy danh sách câu hỏi phục vụ làm bài kiểm tra (ẨN đáp án đúng & giải thích để chống gian lận)
   */
  async getQuestionsForQuiz(quizId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const questions = await this.questionModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .select('_id quizId questionText type options order')
      .sort({ order: 1 })
      .exec();

    return questions;
  }

  /**
   * Chấm điểm bài kiểm tra tự động và thưởng điểm kinh nghiệm (XP)
   */
  async submitQuiz(
    quizId: string,
    userId: string,
    submitDto: SubmitQuizDto,
  ): Promise<QuizSubmissionDocument> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID đề thi hoặc học viên không hợp lệ');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi cần nộp');
    }

    // 1. Lấy toàn bộ câu hỏi gốc có chứa đáp án đúng từ DB
    const questions = await this.questionModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .sort({ order: 1 })
      .exec();

    if (questions.length === 0) {
      throw new BadRequestException('Đề thi này chưa có câu hỏi nào');
    }

    const answerMap = new Map<string, string>();
    submitDto.answers.forEach((ans) => {
      answerMap.set(ans.questionId.toString(), ans.selectedAnswer);
    });

    // 2. Chấm điểm từng câu hỏi
    let correctCount = 0;
    const gradedAnswers = questions.map((q) => {
      const userSelected = (answerMap.get(q._id.toString()) || '').trim();
      const correctAnswer = q.correctAnswer.trim();

      let isCorrect = false;
      if (q.type === QuestionType.FILL_IN_THE_BLANK) {
        // Điền từ: so sánh không phân biệt hoa thường và khoảng trắng thừa
        isCorrect = userSelected.toLowerCase() === correctAnswer.toLowerCase();
      } else {
        // Trắc nghiệm: so khớp chính xác
        isCorrect = userSelected.toLowerCase() === correctAnswer.toLowerCase();
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        questionText: q.questionText,
        selectedAnswer: userSelected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    // 3. Tính điểm thưởng XP: 10 XP mỗi câu đúng + 30 XP thưởng nếu vượt qua bài thi
    const xpEarned = correctCount * 10 + (passed ? 30 : 0);

    // 4. Lưu kết quả nộp bài vào DB
    const submission = new this.submissionModel({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
      answers: gradedAnswers,
      score,
      correctCount,
      totalQuestions,
      passed,
      xpEarned,
    });

    const savedSubmission = await submission.save();

    // 5. Cập nhật điểm XP và Streak chuẩn Duolingo cho học viên
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);
    const todayStr = vnTime.toISOString().split('T')[0];

    const d = new Date(todayStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    const user = await this.userModel.findById(userId);
    let newStreak = 1;
    let streakIncreased = false;
    let isNewStreakDay = false;
    let newTotalXP = xpEarned;

    if (user) {
      if (user.lastActiveDate === todayStr) {
        newStreak = user.streak || 1;
        streakIncreased = false;
        isNewStreakDay = false;
      } else if (user.lastActiveDate === yesterdayStr) {
        newStreak = (user.streak || 0) + 1;
        streakIncreased = true;
        isNewStreakDay = true;
      } else {
        newStreak = 1;
        streakIncreased = true;
        isNewStreakDay = true;
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          $inc: { totalXP: xpEarned },
          $set: {
            streak: newStreak,
            lastActiveDate: todayStr,
          },
          $addToSet: {
            activeDates: todayStr,
          },
        },
        { new: true },
      );
      newTotalXP = updatedUser?.totalXP || (user.totalXP || 0) + xpEarned;
    }

    const subObj = (savedSubmission as any).toObject
      ? (savedSubmission as any).toObject()
      : savedSubmission;

    return {
      ...subObj,
      streak: newStreak,
      totalXP: newTotalXP,
      streakIncreased,
      isNewStreakDay,
      streakMessage: streakIncreased
        ? `Nối dài chuỗi ngày học lên ${newStreak} ngày liên tiếp!`
        : `Duy trì ngọn lửa học tập ${newStreak} ngày!`,
    };
  }

  /**
   * Xem lịch sử làm bài kiểm tra của học viên
   */
  async getUserSubmissions(userId: string, quizId?: string): Promise<QuizSubmissionDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID học viên không hợp lệ');
    }

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (quizId && Types.ObjectId.isValid(quizId)) {
      filter.quizId = new Types.ObjectId(quizId);
    }

    return this.submissionModel
      .find(filter)
      .populate('quizId', 'title type level durationMinutes passingScore')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Xem chi tiết một bài nộp cụ thể
   */
  async getSubmissionDetail(submissionId: string, userId: string): Promise<QuizSubmissionDocument> {
    if (!Types.ObjectId.isValid(submissionId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const sub = await this.submissionModel
      .findOne({
        _id: new Types.ObjectId(submissionId),
        userId: new Types.ObjectId(userId),
      })
      .populate('quizId', 'title type level durationMinutes passingScore')
      .exec();

    if (!sub) {
      throw new NotFoundException('Không tìm thấy kết quả bài thi này');
    }

    return sub;
  }

  /**
   * Tạo đề thi mới (Admin / Teacher)
   */
  async createQuiz(createDto: CreateQuizDto, userId: string): Promise<QuizDocument> {
    const quiz = new this.quizModel({
      ...createDto,
      totalQuestions: 0,
      createdBy: new Types.ObjectId(userId),
    });

    return quiz.save();
  }

  /**
   * Thêm câu hỏi vào đề thi (Admin / Teacher)
   */
  async addQuestion(quizId: string, createQuestionDto: CreateQuestionDto): Promise<QuestionDocument> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const question = new this.questionModel({
      ...createQuestionDto,
      quizId: new Types.ObjectId(quizId),
    });

    const saved = await question.save();

    // Tăng số lượng câu hỏi của đề thi
    await this.quizModel.findByIdAndUpdate(quizId, { $inc: { totalQuestions: 1 } });

    return saved;
  }

  /**
   * Cập nhật thông tin đề thi
   */
  async updateQuiz(id: string, updateDto: UpdateQuizDto): Promise<QuizDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const updated = await this.quizModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    return updated;
  }

  /**
   * Xóa đề thi và các câu hỏi liên quan
   */
  async removeQuiz(id: string): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const quiz = await this.quizModel.findByIdAndDelete(id).exec();
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    // Xóa toàn bộ câu hỏi và bài nộp liên quan
    await this.questionModel.deleteMany({ quizId: new Types.ObjectId(id) });
    await this.submissionModel.deleteMany({ quizId: new Types.ObjectId(id) });

    return { deleted: true, message: `Đã xóa thành công đề thi "${quiz.title}"` };
  }
}
