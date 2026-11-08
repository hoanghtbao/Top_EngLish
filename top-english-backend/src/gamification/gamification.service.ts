/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ Bảng xếp hạng toàn hệ thống, Đua top thi đua và Hệ thống Huy hiệu Gamification
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  VocabularyReview,
  VocabularyReviewDocument,
} from '../srs/schemas/vocabulary-review.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from '../quizzes/schemas/quiz-submission.schema';
import {
  Submission,
  SubmissionDocument,
} from '../classrooms/schemas/submission.schema';

export interface LeaderboardUser {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  streak: number;
  totalXP: number;
  tier: string;
  tierName: string;
}

export interface WeeklyActivityDay {
  dayLabel: string;
  date: string;
  isToday: boolean;
  isActive: boolean;
  isFuture: boolean;
}

export interface StreakStatusResponse {
  streak: number;
  totalXP: number;
  lastActiveDate: string | null;
  isStreakActiveToday: boolean;
  streakIncreased: boolean;
  isNewStreakDay: boolean;
  streakReset: boolean;
  streakMessage: string;
  weeklyActivity: WeeklyActivityDay[];
}

export interface BadgeDefinition {
  id: string;
  title: string;
  category: 'streak' | 'vocabulary' | 'quiz' | 'classroom' | 'xp';
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  xpBonus: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(VocabularyReview.name)
    private readonly vocabReviewModel: Model<VocabularyReviewDocument>,
    @InjectModel(QuizSubmission.name)
    private readonly quizSubmissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(Submission.name)
    private readonly classSubmissionModel: Model<SubmissionDocument>,
  ) {}

  /**
   * Tính toán Hạng đấu (Tier) dựa trên tổng điểm kinh nghiệm XP
   */
  getTierFromXP(xp: number): { tier: string; tierName: string } {
    if (xp >= 5000) return { tier: 'master', tierName: 'Cao Thủ (Master)' };
    if (xp >= 2500) return { tier: 'diamond', tierName: 'Kim Cương (Diamond)' };
    if (xp >= 1000) return { tier: 'platinum', tierName: 'Bạch Kim (Platinum)' };
    if (xp >= 500) return { tier: 'gold', tierName: 'Vàng (Gold)' };
    if (xp >= 200) return { tier: 'silver', tierName: 'Bạc (Silver)' };
    return { tier: 'bronze', tierName: 'Đồng (Bronze)' };
  }

  /**
   * Lấy Bảng xếp hạng người học toàn hệ thống
   * @param period Khung thời gian ('all-time', 'weekly', 'monthly')
   * @param currentUserId ID người dùng đang gọi (để tính vị trí cá nhân)
   */
  async getLeaderboard(
    period: 'all-time' | 'weekly' | 'monthly' = 'all-time',
    currentUserId?: string,
  ): Promise<{
    period: string;
    totalLearners: number;
    leaderboard: LeaderboardUser[];
    myRank: LeaderboardUser | null;
  }> {
    // Lấy toàn bộ người dùng đang hoạt động, sắp xếp giảm dần theo totalXP và streak
    const users = await this.userModel
      .find({ isActive: true })
      .select('fullName email avatar streak totalXP')
      .sort({ totalXP: -1, streak: -1, createdAt: 1 })
      .lean();

    const totalLearners = users.length;

    // Gán thứ hạng Rank cho từng người học
    const rankedUsers: LeaderboardUser[] = users.map((u, index) => {
      const { tier, tierName } = this.getTierFromXP(u.totalXP || 0);
      return {
        rank: index + 1,
        userId: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        avatar: u.avatar || undefined,
        streak: u.streak || 0,
        totalXP: u.totalXP || 0,
        tier,
        tierName,
      };
    });

    // Lấy top 50 người dẫn đầu
    const top50 = rankedUsers.slice(0, 50);

    // Xác định vị trí của người dùng hiện tại
    let myRank: LeaderboardUser | null = null;
    if (currentUserId) {
      myRank = rankedUsers.find((r) => r.userId === currentUserId) || null;
    }

    return {
      period,
      totalLearners,
      leaderboard: top50,
      myRank,
    };
  }

  /**
   * Tính toán và trả về Bộ sưu tập Huy hiệu & Tiến độ mở khóa của học viên
   * @param userId ID người dùng
   */
  async getUserAchievements(userId: string): Promise<{
    userStats: {
      streak: number;
      totalXP: number;
      tier: string;
      tierName: string;
      vocabStudied: number;
      vocabMastered: number;
      quizzesCompleted: number;
      homeworkSubmitted: number;
    };
    badges: BadgeDefinition[];
    unlockedCount: number;
    totalBadges: number;
    completionPercentage: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userObjectId).lean();

    const streak = user?.streak || 0;
    const totalXP = user?.totalXP || 0;
    const { tier, tierName } = this.getTierFromXP(totalXP);

    // Thống kê hoạt động học tập thực tế
    const [vocabStudied, vocabMastered, quizzesCompleted, perfectQuizzes, homeworkSubmitted] =
      await Promise.all([
        this.vocabReviewModel.countDocuments({ userId: userObjectId }),
        this.vocabReviewModel.countDocuments({
          userId: userObjectId,
          isMastered: true,
        }),
        this.quizSubmissionModel.countDocuments({ userId: userObjectId }),
        this.quizSubmissionModel.countDocuments({
          userId: userObjectId,
          score: 100,
        }),
        this.classSubmissionModel.countDocuments({ student: userObjectId }),
      ]);

    // Định nghĩa 12 huy hiệu danh giá
    const badges: BadgeDefinition[] = [
      // 1. Chuỗi ngày học liên tục (Streak)
      {
        id: 'streak_3',
        title: 'Khởi Đầu Bền Bỉ',
        category: 'streak',
        description: 'Duy trì chuỗi ngày học liên tục trong 3 ngày',
        icon: 'Flame',
        tier: 'bronze',
        progress: Math.min(streak, 3),
        maxProgress: 3,
        unlocked: streak >= 3,
        unlockedAt: streak >= 3 ? new Date().toISOString() : null,
        xpBonus: 50,
      },
      {
        id: 'streak_7',
        title: 'Chiến Binh Tuần Lễ',
        category: 'streak',
        description: 'Duy trì chuỗi ngày học liên tục trong 7 ngày',
        icon: 'Flame',
        tier: 'silver',
        progress: Math.min(streak, 7),
        maxProgress: 7,
        unlocked: streak >= 7,
        unlockedAt: streak >= 7 ? new Date().toISOString() : null,
        xpBonus: 120,
      },
      {
        id: 'streak_30',
        title: 'Huyền Thoại Bất Khuất',
        category: 'streak',
        description: 'Duy trì chuỗi ngày học liên tục trong 30 ngày',
        icon: 'Flame',
        tier: 'diamond',
        progress: Math.min(streak, 30),
        maxProgress: 30,
        unlocked: streak >= 30,
        unlockedAt: streak >= 30 ? new Date().toISOString() : null,
        xpBonus: 500,
      },

      // 2. Học từ vựng Flashcard & SRS
      {
        id: 'vocab_10',
        title: 'Nhà Thu Thập Từ Vựng',
        category: 'vocabulary',
        description: 'Học và ôn tập ít nhất 10 từ vựng qua Flashcard',
        icon: 'BookOpen',
        tier: 'bronze',
        progress: Math.min(vocabStudied, 10),
        maxProgress: 10,
        unlocked: vocabStudied >= 10,
        unlockedAt: vocabStudied >= 10 ? new Date().toISOString() : null,
        xpBonus: 40,
      },
      {
        id: 'vocab_50',
        title: 'Bậc Thầy Ghi Nhớ',
        category: 'vocabulary',
        description: 'Học và ôn tập ít nhất 50 từ vựng qua Spaced Repetition',
        icon: 'BookOpen',
        tier: 'silver',
        progress: Math.min(vocabStudied, 50),
        maxProgress: 50,
        unlocked: vocabStudied >= 50,
        unlockedAt: vocabStudied >= 50 ? new Date().toISOString() : null,
        xpBonus: 150,
      },
      {
        id: 'vocab_master',
        title: 'Ký Ức Dài Hạn',
        category: 'vocabulary',
        description: 'Đưa ít nhất 5 từ vựng vào trạng thái thuộc làu (Mastered)',
        icon: 'Star',
        tier: 'gold',
        progress: Math.min(vocabMastered, 5),
        maxProgress: 5,
        unlocked: vocabMastered >= 5,
        unlockedAt: vocabMastered >= 5 ? new Date().toISOString() : null,
        xpBonus: 200,
      },

      // 3. Bài tập trắc nghiệm Quiz
      {
        id: 'quiz_novice',
        title: 'Thử Thách Trí Tuệ',
        category: 'quiz',
        description: 'Hoàn thành bài kiểm tra trắc nghiệm Quiz đầu tiên',
        icon: 'HelpCircle',
        tier: 'bronze',
        progress: Math.min(quizzesCompleted, 1),
        maxProgress: 1,
        unlocked: quizzesCompleted >= 1,
        unlockedAt: quizzesCompleted >= 1 ? new Date().toISOString() : null,
        xpBonus: 30,
      },
      {
        id: 'quiz_ace',
        title: 'Điểm Số Tuyệt Đối',
        category: 'quiz',
        description: 'Đạt điểm tối đa 100% trong bài kiểm tra Quiz',
        icon: 'Target',
        tier: 'gold',
        progress: Math.min(perfectQuizzes, 1),
        maxProgress: 1,
        unlocked: perfectQuizzes >= 1,
        unlockedAt: perfectQuizzes >= 1 ? new Date().toISOString() : null,
        xpBonus: 100,
      },
      {
        id: 'quiz_champion',
        title: 'Xạ Thủ Trắc Nghiệm',
        category: 'quiz',
        description: 'Hoàn thành ít nhất 5 bài kiểm tra trắc nghiệm',
        icon: 'Award',
        tier: 'silver',
        progress: Math.min(quizzesCompleted, 5),
        maxProgress: 5,
        unlocked: quizzesCompleted >= 5,
        unlockedAt: quizzesCompleted >= 5 ? new Date().toISOString() : null,
        xpBonus: 150,
      },

      // 4. Lớp học trực tuyến
      {
        id: 'class_homework',
        title: 'Học Sinh Chăm Chỉ',
        category: 'classroom',
        description: 'Hoàn thành và nộp bài tập trong lớp học trực tuyến',
        icon: 'GraduationCap',
        tier: 'silver',
        progress: Math.min(homeworkSubmitted, 1),
        maxProgress: 1,
        unlocked: homeworkSubmitted >= 1,
        unlockedAt: homeworkSubmitted >= 1 ? new Date().toISOString() : null,
        xpBonus: 80,
      },

      // 5. Mốc kinh nghiệm XP
      {
        id: 'xp_500',
        title: 'Thăng Hạng Vàng',
        category: 'xp',
        description: 'Tích lũy tối thiểu 500 điểm kinh nghiệm XP',
        icon: 'Trophy',
        tier: 'gold',
        progress: Math.min(totalXP, 500),
        maxProgress: 500,
        unlocked: totalXP >= 500,
        unlockedAt: totalXP >= 500 ? new Date().toISOString() : null,
        xpBonus: 100,
      },
      {
        id: 'xp_1000',
        title: 'Bậc Thầy Tinh Hoa',
        category: 'xp',
        description: 'Tích lũy tối thiểu 1,000 điểm kinh nghiệm XP',
        icon: 'Sparkles',
        tier: 'diamond',
        progress: Math.min(totalXP, 1000),
        maxProgress: 1000,
        unlocked: totalXP >= 1000,
        unlockedAt: totalXP >= 1000 ? new Date().toISOString() : null,
        xpBonus: 300,
      },
    ];

    const unlockedCount = badges.filter((b) => b.unlocked).length;
    const totalBadges = badges.length;
    const completionPercentage = Math.round((unlockedCount / totalBadges) * 100);

    return {
      userStats: {
        streak,
        totalXP,
        tier,
        tierName,
        vocabStudied,
        vocabMastered,
        quizzesCompleted,
        homeworkSubmitted,
      },
      badges,
      unlockedCount,
      totalBadges,
      completionPercentage,
    };
  }

  /**
   * Helper: Lấy ngày hiện tại theo định dạng 'YYYY-MM-DD' (Chuẩn múi giờ Việt Nam GMT+7)
   */
  getTodayVN(): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);
    return vnTime.toISOString().split('T')[0];
  }

  /**
   * Helper: Lấy ngày hôm qua theo định dạng 'YYYY-MM-DD'
   */
  getYesterdayVN(todayStr: string): string {
    const d = new Date(todayStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper: Tạo danh sách 7 ngày trong tuần hiện tại (Thứ Hai -> Chủ Nhật) theo chuẩn Duolingo
   */
  generateWeeklyActivity(activeDates: string[], todayStr: string): WeeklyActivityDay[] {
    const today = new Date(todayStr + 'T00:00:00.000Z');
    const dayOfWeek = today.getUTCDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + distanceToMonday);

    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const week: WeeklyActivityDay[] = [];

    const activeSet = new Set(activeDates || []);

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setUTCDate(monday.getUTCDate() + i);
      const dateStr = cur.toISOString().split('T')[0];
      week.push({
        dayLabel: dayNames[i],
        date: dateStr,
        isToday: dateStr === todayStr,
        isActive: activeSet.has(dateStr),
        isFuture: dateStr > todayStr,
      });
    }

    return week;
  }

  /**
   * Lấy trạng thái Chuỗi Streak chuẩn Duolingo theo thời gian thực (Realtime Strict Streak)
   */
  async getStreakStatus(userId: string): Promise<StreakStatusResponse> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    const todayStr = this.getTodayVN();
    const yesterdayStr = this.getYesterdayVN(todayStr);

    let isStreakActiveToday = false;
    let actualStreak = user.streak || 0;

    if (user.lastActiveDate === todayStr) {
      // Đã duy trì chuỗi hôm nay
      isStreakActiveToday = true;
      actualStreak = user.streak || 1;
    } else if (user.lastActiveDate === yesterdayStr) {
      // Hôm qua có học, hôm nay chưa học: Streak vẫn giữ nhưng đang có nguy cơ tắt lửa!
      isStreakActiveToday = false;
      actualStreak = user.streak || 0;
    } else {
      // Nghỉ học từ 2 ngày trở lên: Chuỗi đã bị đứt!
      isStreakActiveToday = false;
      actualStreak = 0;
    }

    const activeDates = (user as any).activeDates || [];
    const weeklyActivity = this.generateWeeklyActivity(activeDates, todayStr);

    const streakMessage = isStreakActiveToday
      ? `Tuyệt vời! Ngọn lửa học tập của bạn đang rực sáng hôm nay (${actualStreak} ngày liên tiếp).`
      : actualStreak > 0
      ? `Ngọn lửa của bạn đang có nguy cơ lụi tàn! Hãy hoàn thành 1 bài học ngay hôm nay để giữ chuỗi ${actualStreak} ngày.`
      : 'Bắt đầu bài học đầu tiên hôm nay để thắp sáng ngọn lửa chuỗi ngày học tập!';

    return {
      streak: actualStreak,
      totalXP: user.totalXP || 0,
      lastActiveDate: user.lastActiveDate,
      isStreakActiveToday,
      streakIncreased: false,
      isNewStreakDay: false,
      streakReset: false,
      streakMessage,
      weeklyActivity,
    };
  }

  /**
   * Ghi nhận hoạt động học tập (SRS Flashcard, Quiz, Homework) và cập nhật Streak chuẩn Duolingo
   */
  async recordStreakActivity(
    userId: string,
    xpEarned: number = 0,
  ): Promise<StreakStatusResponse> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    const todayStr = this.getTodayVN();
    const yesterdayStr = this.getYesterdayVN(todayStr);

    let newStreak = user.streak || 0;
    let streakIncreased = false;
    let isNewStreakDay = false;
    let streakReset = false;
    let streakMessage = '';

    if (user.lastActiveDate === todayStr) {
      // Trường hợp 1: Hôm nay đã duy trì chuỗi rồi
      streakIncreased = false;
      isNewStreakDay = false;
      newStreak = user.streak || 1;
      streakMessage = `Bạn đã hoàn thành mục tiêu học tập ngày hôm nay! Chuỗi hiện tại: ${newStreak} ngày.`;
    } else if (user.lastActiveDate === yesterdayStr) {
      // Trường hợp 2: Học liên tiếp so với hôm qua -> Tăng Streak +1
      newStreak = (user.streak || 0) + 1;
      streakIncreased = true;
      isNewStreakDay = true;
      streakMessage = `Tuyệt vời! Bạn đã nâng chuỗi streak lên ${newStreak} ngày liên tiếp!`;
    } else {
      // Trường hợp 3: Bị đứt chuỗi hoặc lần đầu tiên học -> Khởi động lại 1 ngày
      newStreak = 1;
      streakIncreased = true;
      isNewStreakDay = true;
      streakReset = (user.streak || 0) > 0;
      streakMessage = 'Chúc mừng bạn đã thắp sáng ngọn lửa chuỗi ngày học tập mới!';
    }

    // Cập nhật DB
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

    const activeDates = (updatedUser as any)?.activeDates || [todayStr];
    const weeklyActivity = this.generateWeeklyActivity(activeDates, todayStr);

    return {
      streak: newStreak,
      totalXP: updatedUser?.totalXP || (user.totalXP || 0) + xpEarned,
      lastActiveDate: todayStr,
      isStreakActiveToday: true,
      streakIncreased,
      isNewStreakDay,
      streakReset,
      streakMessage,
      weeklyActivity,
    };
  }
}
