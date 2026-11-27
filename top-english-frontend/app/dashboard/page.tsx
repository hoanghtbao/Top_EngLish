/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Bảng tổng quan tiến độ học tập và Phòng ôn tập thông minh SRS (Spaced Repetition System)
 */

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import PageHeaderBanner from "../../components/PageHeaderBanner";
import { useAuth } from "../../context/auth-context";
import { useSound } from "../../context/sound-context";
import { fetchApi } from "../../lib/api-client";
import { speakText } from "../../lib/speech";

// --- TYPES & INTERFACES ---
interface DashboardData {
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
  recentSubmissions: Array<{
    _id: string;
    quizId: {
      _id: string;
      title: string;
      type: string;
      level: string;
      durationMinutes: number;
      passingScore: number;
    };
    score: number;
    passed: boolean;
    timeSpentSeconds: number;
    totalQuestions: number;
    correctAnswers: number;
    createdAt: string;
  }>;
}

interface TopicClassRef {
  _id: string;
  name: string;
  code?: string;
}

interface TopicRef {
  _id: string;
  title: string;
  slug: string;
  level: string;
  lessonNumber?: number;
  vocabClassId?: TopicClassRef | string | null;
}

interface SrsStats {
  learning: number;
  reviewing: number;
  mastered: number;
  dueToday: number;
  safeCount?: number;
  totalReviewed: number;
  totalVocabularies?: number;
  unlearnedCount?: number;
  retentionRate?: number;
  levelBreakdown?: {
    level0: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

interface DueWordItem {
  reviewId: string | null;
  repetitionLevel: number;
  reviewCount: number;
  nextReviewDate: string;
  isMastered: boolean;
  isNew: boolean;
  isRequeued?: boolean;
  vocabulary: {
    _id: string;
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    exampleSentence?: string;
    exampleMeaning?: string;
    topicId?: TopicRef;
  };
}

type MemoryBucketType = "all" | "learning" | "reviewing" | "mastered" | "due";

interface MemoryWordItem {
  reviewId: string;
  repetitionLevel: number;
  reviewCount: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
  isMastered: boolean;
  isDueToday: boolean;
  vocabulary: {
    _id: string;
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    topicId?: TopicRef;
  };
}

function getTopicClassLabel(topic?: TopicRef): string | null {
  if (!topic?.vocabClassId) return null;
  if (typeof topic.vocabClassId === "object") {
    return topic.vocabClassId.name || topic.vocabClassId.code || null;
  }
  return null;
}

function getNextIntervalDays(
  currentLevel: number,
  rating: "again" | "hard" | "good" | "easy",
): number {
  switch (rating) {
    case "again":
    case "hard":
      return 1;
    case "good": {
      const next = Math.min(4, currentLevel + 1);
      return next === 1 ? 1 : next === 2 ? 3 : next === 3 ? 7 : 14;
    }
    case "easy": {
      const next = Math.min(4, currentLevel + 2);
      return next <= 1 ? 2 : next === 2 ? 5 : next === 3 ? 10 : 30;
    }
  }
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex">
      <div className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen shrink-0" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80" />
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Đang nạp dữ liệu tiến độ học tập và thuật toán SRS...
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, updateStreakInfo } = useAuth();
  const { playClickSound, playWaterDrop, playSuccessSound } = useSound();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [srsStats, setSrsStats] = useState<SrsStats | null>(null);
  const [dueWords, setDueWords] = useState<DueWordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- SRS REVIEW ROOM STATE ---
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewEarnedXp, setReviewEarnedXp] = useState<number | null>(null);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);
  const [sessionTotalXpEarned, setSessionTotalXpEarned] = useState(0);
  const reviewLockRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- MEMORY CURVE BUCKET INSPECTOR STATE ---
  const [activeBucket, setActiveBucket] = useState<MemoryBucketType | null>(null);
  const [bucketWords, setBucketWords] = useState<MemoryWordItem[]>([]);
  const [isLoadingBucket, setIsLoadingBucket] = useState(false);

  const openMemoryBucket = useCallback(
    async (bucket: MemoryBucketType) => {
      playClickSound();
      setActiveBucket(bucket);
      setIsLoadingBucket(true);
      try {
        const res = await fetchApi<MemoryWordItem[]>(
          `/srs/memory-words?bucket=${bucket}`
        );
        setBucketWords(res.data || []);
      } catch (err) {
        console.error("Lỗi tải danh sách từ vựng bộ nhớ SRS:", err);
        setBucketWords([]);
      } finally {
        setIsLoadingBucket(false);
      }
    },
    [playClickSound]
  );

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Tải dữ liệu tổng quan (chỉ hiện skeleton ở lần nạp đầu tiên)
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    reviewLockRef.current = false;
    setIsSubmittingReview(false);
    // Nếu chưa có token trong localStorage thì không gọi API bảo mật
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      setIsLoading(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
        setSessionReviewedCount(0);
        setSessionTotalXpEarned(0);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [dashRes, statsRes, dueRes] = await Promise.all([
        fetchApi<DashboardData>("/srs/dashboard"),
        fetchApi<SrsStats>("/srs/stats"),
        fetchApi<DueWordItem[]>("/srs/due-words"),
      ]);

      if (dashRes.data) {
        setDashboardData(dashRes.data);
      }
      if (statsRes.data) {
        setSrsStats(statsRes.data);
      }
      if (dueRes.data) {
        setDueWords(dueRes.data);
        setCurrentWordIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      if (
        err.message?.includes("đăng nhập") ||
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized")
      ) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục học tập.");
      } else {
        console.error("Lỗi khi tải dữ liệu Dashboard:", err);
        setError(
          err.message ||
            "Không thể nạp dữ liệu tiến độ. Vui lòng kiểm tra kết nối mạng."
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const userId = user?._id;
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && userId) {
        loadDashboardData(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, userId, loadDashboardData]);

  // Xử lý gửi đánh giá SRS (chống double-click và cập nhật số liệu real-time)
  const handleRatingSubmit = async (rating: "again" | "hard" | "good" | "easy") => {
    playClickSound();
    if (
      reviewLockRef.current ||
      isSubmittingReview ||
      dueWords.length === 0 ||
      currentWordIndex >= dueWords.length
    ) {
      return;
    }

    const currentItem = dueWords[currentWordIndex];
    if (!currentItem?.vocabulary?._id) return;

    reviewLockRef.current = true;
    setIsSubmittingReview(true);

    try {
      const res = await fetchApi<{
        repetitionLevel: number;
        intervalDays: number;
        nextReviewDate: string;
        isMastered: boolean;
        xpEarned: number;
        streak?: number;
        totalXP?: number;
        streakIncreased?: boolean;
        isNewStreakDay?: boolean;
        streakMessage?: string;
        stats?: SrsStats;
      }>("/srs/review", {
        method: "POST",
        body: JSON.stringify({
          vocabularyId: currentItem.vocabulary._id,
          rating,
        }),
      });

      const earned = res.data?.xpEarned || 10;
      setReviewEarnedXp(earned);
      setSessionReviewedCount((prev) => prev + 1);
      setSessionTotalXpEarned((prev) => prev + earned);

      if (res.data?.isMastered) {
        playSuccessSound();
      } else {
        playClickSound();
      }

      // Cập nhật XP & Streak tức thì lên Header và toàn hệ thống qua AuthContext (không hiện toast đè lên badge +XP trên thẻ)
      if (res.data && updateStreakInfo) {
        updateStreakInfo({
          streak: res.data.streak,
          totalXP: res.data.totalXP,
          xpEarned: earned,
          streakIncreased: res.data.streakIncreased,
          isNewStreakDay: res.data.isNewStreakDay,
          streakMessage: res.data.streakMessage,
          silentToast: true,
        });
      }

      // Cập nhật ngay Đường cong trí nhớ & KPI từ vựng mà không cần F5
      if (res.data?.stats) {
        setSrsStats(res.data.stats);
      }

      // Cập nhật XP, Streak & Vocabulary stats trên dashboard UI cục bộ
      if (dashboardData) {
        const nextTotal = res.data?.totalXP !== undefined
          ? res.data.totalXP
          : dashboardData.user.totalXP + earned;
        setDashboardData({
          ...dashboardData,
          user: {
            ...dashboardData.user,
            totalXP: nextTotal,
            streak: res.data?.streak !== undefined ? res.data.streak : dashboardData.user.streak,
          },
          vocabulary: res.data?.stats
            ? {
                totalReviewed: res.data.stats.totalReviewed,
                masteredCount: res.data.stats.mastered,
                dueTodayCount: res.data.stats.dueToday,
              }
            : dashboardData.vocabulary,
        });
      }

      // Nếu chọn "Quên hoàn toàn", đẩy thẻ về cuối phiên để nhắc lại ngay trong buổi
      if (rating === "again" && !currentItem.isRequeued) {
        setDueWords((prev) => [
          ...prev,
          {
            ...currentItem,
            repetitionLevel: 0,
            isNew: false,
            isRequeued: true,
          },
        ]);
      }

      // Giữ khóa nút cho tới khi chuyển xong sang thẻ tiếp theo để tránh gửi trùng 2 lần
      advanceTimerRef.current = setTimeout(() => {
        setReviewEarnedXp(null);
        setIsFlipped(false);
        setCurrentWordIndex((prev) => prev + 1);
        reviewLockRef.current = false;
        setIsSubmittingReview(false);
        advanceTimerRef.current = null;
      }, 700);
    } catch (err: any) {
      console.error("Lỗi khi ghi nhận đánh giá SRS:", err);
      alert(err.message || "Ghi nhận đánh giá thất bại. Vui lòng thử lại!");
      reviewLockRef.current = false;
      setIsSubmittingReview(false);
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    speakText(text);
  };

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  // Nếu chưa đăng nhập, hướng dẫn người dùng đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <AppLayout>
        <main className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="size-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
            <Brain className="size-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Đăng nhập để theo dõi Tiến độ & Ôn tập SRS
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mb-8">
            Hệ thống lặp lại ngắt quãng (Spaced Repetition System) cá nhân hóa lộ
            trình ghi nhớ từ vựng và theo dõi chuỗi ngày học của riêng bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              Đăng nhập ngay <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto h-11 px-6 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition flex items-center justify-center"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </main>
      </AppLayout>
    );
  }

  const currentWordItem = dueWords[currentWordIndex];
  const isSessionFinished =
    dueWords.length > 0 && currentWordIndex >= dueWords.length;

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* --- HEADER BANNER --- */}
        <PageHeaderBanner
          pageKey="dashboard"
          size="lg"
          badgeIcon={<Sparkles className="size-3.5" />}
          badgeText="Spaced Repetition System (SRS)"
          title={`Chào mừng trở lại, ${dashboardData?.user.fullName || user.fullName}!`}
          description="Thuật toán trí nhớ Ebbinghaus tối ưu hóa chu kỳ nhắc lại từ vựng và duy trì chuỗi Streak mỗi ngày."
          stats={[
            {
              icon: <Flame className="size-4" />,
              label: "Chuỗi Streak",
              value: `${dashboardData?.user.streak || 0} ngày`,
            },
            {
              icon: <BookOpen className="size-4" />,
              label: "Đến hạn ôn",
              value: `${dashboardData?.vocabulary.dueTodayCount ?? 0} từ`,
            },
            {
              icon: <Layers className="size-4" />,
              label: "Phiên ôn hôm nay",
              value: `${Math.max(0, dueWords.length - currentWordIndex)} thẻ`,
            },
          ]}
        />

        {/* --- KPI OVERVIEW CARDS (5 METRICS) --- */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Streak */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => playClickSound()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playClickSound();
              }
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2 cursor-pointer transition-all hover:border-amber-400 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            title="Chuỗi ngày học liên tục (Bấm để nghe âm thanh tương tác)"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Chuỗi ngày</span>
              <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Flame className="size-4 fill-amber-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {dashboardData?.user.streak || 0}{" "}
                <span className="text-sm font-semibold text-slate-500">ngày</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                Liên tục không gián đoạn
              </p>
            </div>
          </div>

          {/* Card 2: Total XP */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => playClickSound()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playClickSound();
              }
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2 cursor-pointer transition-all hover:border-teal-400 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            title="Kinh nghiệm tích lũy (Bấm để nghe âm thanh tương tác)"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Kinh nghiệm</span>
              <div className="size-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Trophy className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                {dashboardData?.user.totalXP || 0}{" "}
                <span className="text-sm font-semibold text-slate-500">XP</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Tích lũy từ học tập
              </p>
            </div>
          </div>

          {/* Card 3: Vocab Mastered */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => playClickSound()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playClickSound();
              }
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2 cursor-pointer transition-all hover:border-emerald-400 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            title="Từ vựng thành thạo (Bấm để nghe âm thanh tương tác)"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Từ thành thạo</span>
              <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {dashboardData?.vocabulary.masteredCount || 0}{" "}
                <span className="text-sm font-semibold text-slate-500">từ</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Cấp 4 / Trí nhớ dài hạn
              </p>
            </div>
          </div>

          {/* Card 4: Grammar Completed */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => playClickSound()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playClickSound();
              }
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2 cursor-pointer transition-all hover:border-sky-400 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            title="Tiến độ ngữ pháp (Bấm để nghe âm thanh tương tác)"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ngữ pháp</span>
              <div className="size-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                <GraduationCap className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {dashboardData?.grammar.completionPercentage || 0}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {dashboardData?.grammar.completedLessonsCount || 0}/
                {dashboardData?.grammar.totalGrammarLessons || 0} bài đã học
              </p>
            </div>
          </div>

          {/* Card 5: Quizzes Average */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => playClickSound()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playClickSound();
              }
            }}
            className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2 cursor-pointer transition-all hover:border-purple-400 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            title="Điểm thi trung bình (Bấm để nghe âm thanh tương tác)"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Điểm thi TB</span>
              <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Award className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                {dashboardData?.quizzes.averageScore || 0}{" "}
                <span className="text-sm font-semibold text-slate-500">/100</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {dashboardData?.quizzes.passedAttempts || 0}/
                {dashboardData?.quizzes.totalAttempts || 0} bài kiểm tra đạt
              </p>
            </div>
          </div>
        </section>

        {/* --- MAIN CONTENT: 2-COLUMN LAYOUT (SRS ROOM & MEMORY CURVE) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: SMART SRS REVIEW ROOM */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Brain className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Phòng Ôn Tập Thông Minh (SRS)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Phản xạ lặp lại ngắt quãng theo thuật toán Leitner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {dueWords.length > 0 && !isSessionFinished && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Thẻ {currentWordIndex + 1} / {dueWords.length}
                  </span>
                )}
                <button
                  onClick={() => {
                    playClickSound();
                    loadDashboardData(true);
                  }}
                  disabled={isRefreshing}
                  title="Làm mới số liệu & nạp phiên mới"
                  className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>
            </div>

            {/* ERROR ALERT IF ANY */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <p className="font-semibold">{error}</p>
                </div>
                {error.includes("đăng nhập") && (
                  <Link
                    href="/login?redirect=/dashboard"
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition"
                  >
                    Đăng nhập lại
                  </Link>
                )}
              </div>
            )}

            {/* SRS REVIEW CONTAINER */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col gap-6 relative">
              {/* Floating Earned XP Popup Feedback */}
              {reviewEarnedXp && (
                <div className="absolute top-6 right-6 z-20 animate-bounce px-3 py-1.5 rounded-full bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="size-3.5" /> +{reviewEarnedXp} XP!
                </div>
              )}

              {/* CASE 1: EMPTY QUEUE / COMPLETED SESSION */}
              {isSessionFinished || dueWords.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-5">
                  <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Trophy className="size-10" />
                  </div>
                  <div className="max-w-md flex flex-col gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Hoàn thành xuất sắc phiên ôn tập! 🎉
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sessionReviewedCount > 0
                        ? `Bạn vừa ôn tập thành công ${sessionReviewedCount} từ vựng và thu hoạch thêm +${sessionTotalXpEarned} XP kinh nghiệm.`
                        : "Hôm nay không còn từ vựng nào đến hạn ôn tập. Tất cả từ vựng đều đang nằm trong chu kỳ an toàn."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        loadDashboardData(true);
                      }}
                      disabled={isRefreshing}
                      className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} /> Ôn tiếp phiên mới
                    </button>
                    <Link
                      href="/topics"
                      className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <BookOpen className="size-4" /> Học thêm từ mới ở Chủ đề
                    </Link>
                    <Link
                      href="/quizzes"
                      className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Zap className="size-4" /> Thử sức bài kiểm tra Quiz
                    </Link>
                  </div>
                </div>
              ) : (
                /* CASE 2: ACTIVE SRS REVIEW CARD */
                <>
                  {/* Progress Line */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${((currentWordIndex + 1) / dueWords.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* 3D Flashcard Presentation */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      playClickSound();
                      setIsFlipped(!isFlipped);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playClickSound();
                        setIsFlipped(!isFlipped);
                      }
                    }}
                    className="min-h-[280px] p-5 sm:p-7 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/60 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-between text-center gap-4 cursor-pointer select-none transition-all group relative active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <div className="w-full flex flex-wrap items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {currentWordItem.isNew ? (
                          <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <Sparkles className="size-3" /> Từ mới gợi ý
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Layers className="size-3 text-emerald-500" /> Hộp SRS: {currentWordItem.repetitionLevel}/4
                          </span>
                        )}
                      </span>

                      {currentWordItem.vocabulary?.topicId && (() => {
                        const topic = currentWordItem.vocabulary.topicId;
                        const classNameLabel = getTopicClassLabel(topic);
                        return (
                          <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-full">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/70">
                              <FolderOpen className="size-3 shrink-0" />
                              {classNameLabel ? `Lớp: ${classNameLabel}` : "Chủ đề tự do"}
                            </span>
                            <Link
                              href={`/topics/${topic._id}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Mở bài học từ vựng này"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                            >
                              {topic.title} ({topic.level})
                            </Link>
                          </div>
                        );
                      })()}
                    </div>

                    {!isFlipped ? (
                      /* FRONT SIDE: WORD + IPA + AUDIO */
                      <div className="flex flex-col items-center gap-3 py-2">
                        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {currentWordItem.vocabulary?.word}
                        </h3>

                        <div className="flex items-center gap-3">
                          <span className="text-sm sm:text-base font-serif text-slate-500 dark:text-slate-400">
                            {currentWordItem.vocabulary?.phonetic || "/--/"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic">
                            {currentWordItem.vocabulary?.partOfSpeech || "noun"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleSpeak(currentWordItem.vocabulary?.word || "", e)
                            }
                            className="size-8 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center transition cursor-pointer"
                            title="Nghe phát âm chuẩn"
                          >
                            <Volume2 className="size-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5 group-hover:text-emerald-600 transition">
                          <RotateCw className="size-3.5 animate-spin-slow" /> Nhấp vào thẻ để lật xem định nghĩa
                        </p>
                      </div>
                    ) : (
                      /* BACK SIDE: MEANING + EXAMPLE SENTENCE */
                      <div className="flex flex-col items-center gap-3 pt-6 max-w-lg">
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {currentWordItem.vocabulary?.meaning}
                        </div>

                        {currentWordItem.vocabulary?.exampleSentence && (
                          <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                              <span>&ldquo;{currentWordItem.vocabulary.exampleSentence}&rdquo;</span>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleSpeak(
                                    currentWordItem.vocabulary.exampleSentence || "",
                                    e
                                  )
                                }
                                className="size-6 text-slate-400 hover:text-emerald-600 shrink-0 ml-2"
                                title="Phát âm câu ví dụ"
                              >
                                <Volume2 className="size-3.5" />
                              </button>
                            </div>
                            {currentWordItem.vocabulary?.exampleMeaning && (
                              <p className="text-[11px] text-slate-500 italic">
                                {currentWordItem.vocabulary.exampleMeaning}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                          <RotateCw className="size-3" /> Nhấp để lật lại mặt trước
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 4 SRS RATING BUTTONS (LEITNER BOX / ANKI STANDARD) */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-center text-slate-500 mb-1">
                      Đánh giá mức độ nhớ của bạn để hệ thống tính toán ngày ôn tập:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Rating 1: AGAIN */}
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleRatingSubmit("again")}
                        className="h-16 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          🔴 Quên hoàn toàn
                        </span>
                        <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                          {currentWordItem.isRequeued
                            ? "Ôn lại: 1 ngày (+5 XP)"
                            : "Nhắc lại cuối phiên (+5 XP)"}
                        </span>
                      </button>

                      {/* Rating 2: HARD */}
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleRatingSubmit("hard")}
                        className="h-16 px-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          🟠 Khó nhớ
                        </span>
                        <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                          Ôn lại: {getNextIntervalDays(currentWordItem.repetitionLevel, "hard")} ngày (+5 XP)
                        </span>
                      </button>

                      {/* Rating 3: GOOD */}
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleRatingSubmit("good")}
                        className="h-16 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          🟢 Nhớ được
                        </span>
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                          Ôn lại: {getNextIntervalDays(currentWordItem.repetitionLevel, "good")} ngày (+10 XP)
                        </span>
                      </button>

                      {/* Rating 4: EASY */}
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={() => handleRatingSubmit("easy")}
                        className="h-16 px-3 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          🔵 Rất dễ
                        </span>
                        <span className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-0.5">
                          Ôn lại: {getNextIntervalDays(currentWordItem.repetitionLevel, "easy")} ngày (+15 XP)
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* RIGHT 5 COLS: MEMORY CURVE DISTRIBUTION & LEARNING SHORTCUTS */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* MEMORY CURVE DISTRIBUTION */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Layers className="size-5" />
                  </div>
                  <div>
                  <h3 className="text-base font-bold tracking-tight">
                    Phân Bổ Đường Cong Trí Nhớ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mức độ lưu giữ từ vựng trong não bộ (Ebbinghaus Model)
                  </p>
                </div>
                </div>

                {srsStats && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      Độ bền ghi nhớ
                    </span>
                    <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                      {srsStats.retentionRate ?? 0}%
                    </span>
                  </div>
                )}
              </div>

              {/* STACKED MEMORY DISTRIBUTION BAR */}
              {(() => {
                const totalSrs = srsStats?.totalReviewed || 0;
                const lCount = srsStats?.learning || 0;
                const rCount = srsStats?.reviewing || 0;
                const mCount = srsStats?.mastered || 0;
                const lPct = totalSrs > 0 ? Math.round((lCount / totalSrs) * 100) : 0;
                const rPct = totalSrs > 0 ? Math.round((rCount / totalSrs) * 100) : 0;
                const mPct = totalSrs > 0 ? Math.max(0, 100 - lPct - rPct) : 0;

                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      {lCount > 0 && (
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{ width: `${(lCount / totalSrs) * 100}%` }}
                          title={`Đang học ban đầu: ${lCount} từ (${lPct}%)`}
                        />
                      )}
                      {rCount > 0 && (
                        <div
                          className="bg-sky-500 h-full transition-all duration-500"
                          style={{ width: `${(rCount / totalSrs) * 100}%` }}
                          title={`Đang ôn củng cố: ${rCount} từ (${rPct}%)`}
                        />
                      )}
                      {mCount > 0 && (
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${(mCount / totalSrs) * 100}%` }}
                          title={`Đã thành thạo: ${mCount} từ (${mPct}%)`}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Hộp 0–1: {lPct}%</span>
                      <span>Hộp 2–3: {rPct}%</span>
                      <span>Hộp 4: {mPct}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* STATS BREAKDOWN */}
              <div className="flex flex-col gap-3">
                {/* Level 0-1: Learning */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openMemoryBucket("learning")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMemoryBucket("learning");
                    }
                  }}
                  className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-amber-400 dark:hover:border-amber-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  title="Bấm để xem danh sách từ đang học ban đầu (Hộp 0 và Hộp 1)"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đang học ban đầu
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp 0 (Chưa nhớ): {srsStats?.levelBreakdown?.level0 ?? 0} · Hộp 1 (1 ngày): {srsStats?.levelBreakdown?.level1 ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 block">
                      {srsStats?.learning || 0} từ
                    </span>
                    <span className="text-[10px] text-slate-400">Xem chi tiết →</span>
                  </div>
                </div>

                {/* Level 2-3: Reviewing */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openMemoryBucket("reviewing")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMemoryBucket("reviewing");
                    }
                  }}
                  className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-sky-400 dark:hover:border-sky-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  title="Bấm để xem danh sách từ đang ôn củng cố (Hộp 2 và Hộp 3)"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-sky-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đang ôn củng cố
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp 2 (3 ngày): {srsStats?.levelBreakdown?.level2 ?? 0} · Hộp 3 (7 ngày): {srsStats?.levelBreakdown?.level3 ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 block">
                      {srsStats?.reviewing || 0} từ
                    </span>
                    <span className="text-[10px] text-slate-400">Xem chi tiết →</span>
                  </div>
                </div>

                {/* Level 4: Mastered */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openMemoryBucket("mastered")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMemoryBucket("mastered");
                    }
                  }}
                  className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-400 dark:hover:border-emerald-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  title="Bấm để xem danh sách từ đã thành thạo (Hộp 4)"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đã thành thạo
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp 4 (14–30 ngày · Trí nhớ dài hạn): {srsStats?.levelBreakdown?.level4 ?? 0} từ
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                      {srsStats?.mastered || 0} từ
                    </span>
                    <span className="text-[10px] text-slate-400">Xem chi tiết →</span>
                  </div>
                </div>
              </div>

              {/* Total Reviewed & Coverage Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Đến hạn ôn hôm nay / Đang an toàn:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openMemoryBucket("due")}
                      className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      title="Xem danh sách từ đến hạn hôm nay"
                    >
                      {srsStats?.dueToday || 0} đến hạn
                    </button>
                    <span>·</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {srsStats?.safeCount ?? Math.max(0, (srsStats?.totalReviewed || 0) - (srsStats?.dueToday || 0))} an toàn
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Tổng bộ nhớ SRS / Toàn kho từ vựng:</span>
                  <button
                    type="button"
                    onClick={() => openMemoryBucket("all")}
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                    title="Xem toàn bộ từ đang theo dõi trong SRS"
                  >
                    {srsStats?.totalReviewed || 0}
                    {srsStats?.totalVocabularies ? ` / ${srsStats.totalVocabularies}` : ""} từ vựng
                  </button>
                </div>

                {typeof srsStats?.unlearnedCount === "number" && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Từ mới chưa học trong hệ thống:</span>
                    <span className="font-semibold">{srsStats.unlearnedCount} từ chưa mở</span>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS / SHORTCUTS */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7 flex flex-col gap-4">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="size-4 text-emerald-500" /> Lộ Trình Học Tiếp Theo
              </h3>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/topics"
                  onClick={() => playClickSound()}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 flex items-center justify-between transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <BookOpen className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition">
                        Khám phá Từ vựng Flashcard
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Nhiều chủ đề chuẩn CEFR A1 - B2
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </Link>

                <Link
                  href="/grammar"
                  onClick={() => playClickSound()}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 flex items-center justify-between transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <GraduationCap className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">
                        Bài học Ngữ pháp Chuyên sâu
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Cấu trúc 3 thể, dấu hiệu & lỗi sai
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-teal-600 transition" />
                </Link>

                <Link
                  href="/quizzes"
                  onClick={() => playClickSound()}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 flex items-center justify-between transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-800 dark:text-slate-200 group-hover:text-sky-600 transition">
                        Luyện Thi Trắc Nghiệm Quiz
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Chấm điểm tức thì, giải thích chi tiết
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-sky-600 transition" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* --- RECENT QUIZ SUBMISSIONS TABLE --- */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <History className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">
                  Lịch Sử Bài Kiểm Tra Gần Đây
                </h3>
                <p className="text-xs text-slate-500">
                  Kết quả các lần thử sức trắc nghiệm và điền từ
                </p>
              </div>
            </div>

            <Link
              href="/quizzes"
              onClick={() => playClickSound()}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả bài thi <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {!dashboardData?.recentSubmissions ||
          dashboardData.recentSubmissions.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
              <HelpCircle className="size-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs sm:text-sm text-slate-500">
                Bạn chưa thực hiện bài thi kiểm tra nào.
              </p>
              <Link
                href="/quizzes"
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                Làm bài thi ngay <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Tên bài kiểm tra</th>
                    <th className="pb-3 font-semibold">Cấp độ</th>
                    <th className="pb-3 font-semibold">Điểm số</th>
                    <th className="pb-3 font-semibold">Số câu đúng</th>
                    <th className="pb-3 font-semibold">Thời gian làm</th>
                    <th className="pb-3 font-semibold">Ngày thi</th>
                    <th className="pb-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dashboardData.recentSubmissions.map((sub) => {
                    const quizTitle = sub.quizId?.title || "Bài kiểm tra";
                    const quizLevel = sub.quizId?.level || "A2";
                    const formattedDate = new Date(
                      sub.createdAt
                    ).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    return (
                      <tr key={sub._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {quizTitle}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {quizLevel}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              sub.passed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {sub.passed ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}
                            {sub.score}/100
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">
                          {sub.correctAnswers}/{sub.totalQuestions} câu
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">
                          {sub.timeSpentSeconds}s
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/quizzes/${sub.quizId?._id || ""}`}
                            onClick={() => playClickSound()}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition cursor-pointer"
                          >
                            Thi lại <ArrowRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MEMORY BUCKET INSPECTOR MODAL */}
      {activeBucket && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveBucket(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[82vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeBucket === "learning" && "Đang học ban đầu (Hộp Leitner 0 – 1)"}
                  {activeBucket === "reviewing" && "Đang ôn củng cố (Hộp Leitner 2 – 3)"}
                  {activeBucket === "mastered" && "Đã thành thạo (Hộp Leitner 4)"}
                  {activeBucket === "due" && "Từ vựng đến hạn ôn hôm nay"}
                  {activeBucket === "all" && "Toàn bộ từ vựng trong bộ nhớ SRS"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết lớp học, bài học, cấp độ hộp và lịch ôn kế tiếp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBucket(null)}
                className="size-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-3">
              {isLoadingBucket ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                  <div className="size-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  Đang tải danh sách từ vựng...
                </div>
              ) : bucketWords.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Chưa có từ vựng nào trong nhóm này.
                </div>
              ) : (
                bucketWords.map((item) => {
                  const topic = item.vocabulary?.topicId;
                  const classNameLabel = getTopicClassLabel(topic);
                  const nextDateText = item.nextReviewDate
                    ? new Date(item.nextReviewDate).toLocaleDateString("vi-VN")
                    : "--";
                  return (
                    <div
                      key={item.reviewId}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.vocabulary?.word}
                          </span>
                          {item.vocabulary?.phonetic && (
                            <span className="text-xs font-serif text-slate-500">
                              {item.vocabulary.phonetic}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            Hộp {item.repetitionLevel}/4
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {item.vocabulary?.meaning}
                        </p>
                        {topic && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                              {classNameLabel ? `Lớp: ${classNameLabel}` : "Chủ đề tự do"}
                            </span>
                            <Link
                              href={`/topics/${topic._id}`}
                              onClick={() => setActiveBucket(null)}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:underline"
                            >
                              {topic.title} ({topic.level})
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] shrink-0">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            item.isDueToday
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {item.isDueToday ? "Đến hạn hôm nay" : `Ôn lại: ${nextDateText}`}
                        </span>
                        <span className="text-slate-400">
                          Đã ôn {item.reviewCount} lần
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
