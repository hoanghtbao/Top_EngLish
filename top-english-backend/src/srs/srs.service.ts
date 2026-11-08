/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý thuật toán lặp lại ngắt quãng SRS (Spaced Repetition System), phân bổ trí nhớ và Dashboard tiến độ học tập
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  VocabularyReview,
  VocabularyReviewDocument,
} from './schemas/vocabulary-review.schema';
import { ReviewWordDto } from './dto/review-word.dto';
import { SrsRating } from './enums/srs-rating.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Vocabulary,
  VocabularyDocument,
} from '../vocabulary/schemas/vocabulary.schema';
import {
  GrammarLesson,
  GrammarLessonDocument,
} from '../grammar/schemas/grammar-lesson.schema';
import {
  UserGrammarProgress,
  UserGrammarProgressDocument,
} from '../grammar/schemas/user-grammar-progress.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from '../quizzes/schemas/quiz-submission.schema';

@Injectable()
export class SrsService {
  private readonly logger = new Logger(SrsService.name);

  constructor(
    @InjectModel(VocabularyReview.name)
    private readonly reviewModel: Model<VocabularyReviewDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Vocabulary.name)
    private readonly vocabModel: Model<VocabularyDocument>,
    @InjectModel(GrammarLesson.name)
    private readonly lessonModel: Model<GrammarLessonDocument>,
    @InjectModel(UserGrammarProgress.name)
    private readonly grammarProgModel: Model<UserGrammarProgressDocument>,
    @InjectModel(QuizSubmission.name)
    private readonly submissionModel: Model<QuizSubmissionDocument>,
  ) {}

  /**
   * Ghi nhận kết quả ôn tập từ vựng và tính toán chu kỳ lặp lại ngắt quãng kế tiếp (SRS Interval)
   */
  async recordReview(
    userId: string,
    dto: ReviewWordDto,
  ): Promise<{
    repetitionLevel: number;
    intervalDays: number;
    nextReviewDate: Date;
    isMastered: boolean;
    xpEarned: number;
    streak: number;
    totalXP: number;
    streakIncreased: boolean;
    isNewStreakDay: boolean;
    streakMessage: string;
  }> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(dto.vocabularyId)) {
      throw new BadRequestException('ID người dùng hoặc từ vựng không hợp lệ');
    }

    const vocab = await this.vocabModel.findById(dto.vocabularyId);
    if (!vocab) {
      throw new NotFoundException('Không tìm thấy từ vựng');
    }

    // 1. Tìm bản ghi tiến độ ôn tập hiện tại của học viên
    const currentReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      vocabularyId: new Types.ObjectId(dto.vocabularyId),
    });

    const currentLevel = currentReview ? currentReview.repetitionLevel : 0;
    let newLevel = 0;
    let intervalDays = 1;
    let xpEarned = 5;

    // 2. Thuật toán Leitner Box / Ebbinghaus Spaced Repetition
    switch (dto.rating) {
      case SrsRating.AGAIN:
        newLevel = 0;
        intervalDays = 1; // Ôn lại vào ngày mai
        xpEarned = 5;
        break;

      case SrsRating.HARD:
        newLevel = Math.max(0, currentLevel - 1);
        intervalDays = 1; // Khó nhớ -> Lặp lại sau 1 ngày
        xpEarned = 5;
        break;

      case SrsRating.GOOD:
        newLevel = Math.min(4, currentLevel + 1);
        intervalDays =
          newLevel === 1 ? 1 : newLevel === 2 ? 3 : newLevel === 3 ? 7 : 14;
        xpEarned = 10;
        break;

      case SrsRating.EASY:
        newLevel = Math.min(4, currentLevel + 2);
        intervalDays =
          newLevel <= 1 ? 2 : newLevel === 2 ? 5 : newLevel === 3 ? 10 : 30;
        xpEarned = 15;
        break;
    }

    const isMastered = newLevel >= 4;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    // 3. Cập nhật hoặc tạo mới bản ghi VocabularyReview
    await this.reviewModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        vocabularyId: new Types.ObjectId(dto.vocabularyId),
      },
      {
        repetitionLevel: newLevel,
        nextReviewDate,
        lastReviewedAt: new Date(),
        isMastered,
        $inc: { reviewCount: 1 },
      },
      { upsert: true, new: true },
    );

    // 4. Cộng điểm XP và cập nhật chuỗi Streak chuẩn Duolingo cho học viên
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

    return {
      repetitionLevel: newLevel,
      intervalDays,
      nextReviewDate,
      isMastered,
      xpEarned,
      streak: newStreak,
      totalXP: newTotalXP,
      streakIncreased,
      isNewStreakDay,
      streakMessage: streakIncreased
        ? `Tuyệt vời! Bạn đã nâng chuỗi streak lên ${newStreak} ngày liên tiếp!`
        : `Bạn đã duy trì ngọn lửa học tập hôm nay (${newStreak} ngày).`,
    };
  }

  /**
   * Lấy danh sách từ vựng đến hạn cần ôn tập hôm nay (nextReviewDate <= endOfToday)
   * Kèm từ mới gợi ý nếu hàng đợi ôn tập ít hơn 5 từ
   */
  async getDueWords(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Lấy các từ đã đến hạn ôn tập
    const dueReviews = await this.reviewModel
      .find({
        userId: new Types.ObjectId(userId),
        nextReviewDate: { $lte: endOfToday },
      })
      .populate({
        path: 'vocabularyId',
        populate: { path: 'topicId', select: 'title slug level' },
      })
      .sort({ nextReviewDate: 1 })
      .exec();

    const dueList: any[] = dueReviews
      .filter((r) => r.vocabularyId)
      .map((r) => ({
        reviewId: r._id,
        repetitionLevel: r.repetitionLevel,
        reviewCount: r.reviewCount,
        nextReviewDate: r.nextReviewDate,
        isMastered: r.isMastered,
        isNew: false,
        vocabulary: r.vocabularyId,
      }));

    // 2. Nếu số từ cần ôn ít hơn 6, bổ sung các từ mới chưa từng học để học viên luôn có học liệu
    if (dueList.length < 6) {
      const reviewedIds = await this.reviewModel
        .find({ userId: new Types.ObjectId(userId) })
        .distinct('vocabularyId');

      const neededCount = 6 - dueList.length;
      const newWords = await this.vocabModel
        .find({ _id: { $nin: reviewedIds } })
        .populate('topicId', 'title slug level')
        .limit(neededCount)
        .exec();

      newWords.forEach((w) => {
        dueList.push({
          reviewId: null,
          repetitionLevel: 0,
          reviewCount: 0,
          nextReviewDate: new Date(),
          isMastered: false,
          isNew: true,
          vocabulary: w,
        });
      });
    }

    return dueList;
  }

  /**
   * Lấy thống kê phân bổ mức độ ghi nhớ từ vựng theo đường cong quên lãng
   */
  async getSrsStats(userId: string): Promise<{
    learning: number; // Level 0 - 1
    reviewing: number; // Level 2 - 3
    mastered: number; // Level 4
    dueToday: number;
    totalReviewed: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const userObjId = new Types.ObjectId(userId);

    const [learning, reviewing, mastered, dueToday, totalReviewed] =
      await Promise.all([
        this.reviewModel.countDocuments({
          userId: userObjId,
          repetitionLevel: { $in: [0, 1] },
        }),
        this.reviewModel.countDocuments({
          userId: userObjId,
          repetitionLevel: { $in: [2, 3] },
        }),
        this.reviewModel.countDocuments({
          userId: userObjId,
          repetitionLevel: 4,
        }),
        this.reviewModel.countDocuments({
          userId: userObjId,
          nextReviewDate: { $lte: endOfToday },
        }),
        this.reviewModel.countDocuments({ userId: userObjId }),
      ]);

    return {
      learning,
      reviewing,
      mastered,
      dueToday,
      totalReviewed,
    };
  }

  /**
   * Lấy toàn bộ số liệu tổng quan tiến độ học tập (Dashboard) của học viên
   */
  async getUserDashboard(userId: string): Promise<{
    user: {
      fullName: string;
      email: string;
      streak: number;
      totalXP: number;
      role: string;
    };
    vocabulary: {
      totalReviewed: number;
      masteredCount: number;
      dueTodayCount: number;
    };
    grammar: {
      completedLessonsCount: number;
      totalGrammarLessons: number;
      completionPercentage: number;
    };
    quizzes: {
      totalAttempts: number;
      passedAttempts: number;
      averageScore: number;
    };
    recentSubmissions: any[];
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const userObjId = new Types.ObjectId(userId);

    // 1. Thông tin người dùng
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // 2. Thống kê từ vựng SRS
    const [vocabStats, totalLessons, grammarCompleted, quizSubmissions] =
      await Promise.all([
        this.getSrsStats(userId),
        this.lessonModel.countDocuments(),
        this.grammarProgModel.countDocuments({
          userId: userObjId,
          isCompleted: true,
        }),
        this.submissionModel
          .find({ userId: userObjId })
          .populate('quizId', 'title type level durationMinutes passingScore')
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
      ]);

    // 3. Tính toán tiến độ ngữ pháp
    const grammarPercentage =
      totalLessons > 0 ? Math.round((grammarCompleted / totalLessons) * 100) : 0;

    // 4. Thống kê bài kiểm tra
    const totalQuizAttempts = quizSubmissions.length;
    const passedQuizAttempts = quizSubmissions.filter((s) => s.passed).length;
    const averageScore =
      totalQuizAttempts > 0
        ? Math.round(
            quizSubmissions.reduce((acc, s) => acc + s.score, 0) /
              totalQuizAttempts,
          )
        : 0;

    return {
      user: {
        fullName: user.fullName,
        email: user.email,
        streak: user.streak,
        totalXP: user.totalXP,
        role: user.role,
      },
      vocabulary: {
        totalReviewed: vocabStats.totalReviewed,
        masteredCount: vocabStats.mastered,
        dueTodayCount: vocabStats.dueToday,
      },
      grammar: {
        completedLessonsCount: grammarCompleted,
        totalGrammarLessons: totalLessons,
        completionPercentage: grammarPercentage,
      },
      quizzes: {
        totalAttempts: totalQuizAttempts,
        passedAttempts: passedQuizAttempts,
        averageScore,
      },
      recentSubmissions: quizSubmissions,
    };
  }
}
