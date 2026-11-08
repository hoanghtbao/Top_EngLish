/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Bảng tổng quan tiến độ học tập và Phòng ôn tập thông minh SRS (Spaced Repetition System)
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
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
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
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

interface SrsStats {
  learning: number;
  reviewing: number;
  mastered: number;
  dueToday: number;
  totalReviewed: number;
}

interface DueWordItem {
  reviewId: string | null;
  repetitionLevel: number;
  reviewCount: number;
  nextReviewDate: string;
  isMastered: boolean;
  isNew: boolean;
  vocabulary: {
    _id: string;
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    exampleSentence?: string;
    exampleMeaning?: string;
    topicId?: {
      _id: string;
      title: string;
      slug: string;
      level: string;
    };
  };
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [srsStats, setSrsStats] = useState<SrsStats | null>(null);
  const [dueWords, setDueWords] = useState<DueWordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- SRS REVIEW ROOM STATE ---
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewEarnedXp, setReviewEarnedXp] = useState<number | null>(null);
  const [sessionReviewedCount, setSessionReviewedCount] = useState(0);
  const [sessionTotalXpEarned, setSessionTotalXpEarned] = useState(0);

  // Tải dữ liệu tổng quan
  const loadDashboardData = useCallback(async () => {
    // Nếu chưa có token trong localStorage thì không gọi API bảo mật
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        loadDashboardData();
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, user, loadDashboardData]);

  // Xử lý gửi đánh giá SRS
  const handleRatingSubmit = async (rating: "again" | "hard" | "good" | "easy") => {
    if (dueWords.length === 0 || currentWordIndex >= dueWords.length) return;

    const currentItem = dueWords[currentWordIndex];
    if (!currentItem?.vocabulary?._id) return;

    try {
      setIsSubmittingReview(true);
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

      // Cập nhật XP & Streak tức thì lên Header và toàn hệ thống qua AuthContext
      if (res.data && updateStreakInfo) {
        updateStreakInfo({
          streak: res.data.streak,
          totalXP: res.data.totalXP,
          xpEarned: earned,
          streakIncreased: res.data.streakIncreased,
          isNewStreakDay: res.data.isNewStreakDay,
          streakMessage: res.data.streakMessage,
        });
      }

      // Cập nhật XP trên dashboard UI cục bộ
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
        });
      }

      // Ẩn hiệu ứng XP popup sau 1.2s và chuyển sang thẻ tiếp theo
      setTimeout(() => {
        setReviewEarnedXp(null);
        setIsFlipped(false);
        setCurrentWordIndex((prev) => prev + 1);
      }, 700);
    } catch (err: any) {
      console.error("Lỗi khi ghi nhận đánh giá SRS:", err);
      alert(err.message || "Ghi nhận đánh giá thất bại. Vui lòng thử lại!");
    } finally {
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
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              Đăng nhập ngay <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/register"
              className="h-11 px-6 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition"
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
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* --- HEADER BANNER --- */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold w-fit">
              <Sparkles className="size-3.5" /> Spaced Repetition System (SRS)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng trở lại, {dashboardData?.user.fullName || user.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Thuật toán trí nhớ Ebbinghaus đang tối ưu hóa chu kỳ nhắc lại từ vựng
              của bạn. Duy trì chuỗi Streak mỗi ngày để đạt hiệu quả ghi nhớ lâu bền nhất.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              title="Làm mới số liệu"
              className="h-11 px-4 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="size-4" /> Làm mới dữ liệu
            </button>
          </div>
        </section>

        {/* --- KPI OVERVIEW CARDS (5 METRICS) --- */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Streak */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2">
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
          <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2">
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

              {dueWords.length > 0 && !isSessionFinished && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Thẻ {currentWordIndex + 1} / {dueWords.length}
                </span>
              )}
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
                    <Link
                      href="/topics"
                      className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
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
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="min-h-[280px] p-6 sm:p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/60 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-center gap-4 cursor-pointer select-none transition-all group relative"
                  >
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {currentWordItem.isNew ? (
                        <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Sparkles className="size-3" /> Từ mới gợi ý
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Layers className="size-3 text-emerald-500" /> Cấp độ SRS: {currentWordItem.repetitionLevel}/4
                        </span>
                      )}
                    </span>

                    {currentWordItem.vocabulary?.topicId && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        {currentWordItem.vocabulary.topicId.title} ({currentWordItem.vocabulary.topicId.level})
                      </span>
                    )}

                    {!isFlipped ? (
                      /* FRONT SIDE: WORD + IPA + AUDIO */
                      <div className="flex flex-col items-center gap-3 pt-6">
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
                          Ôn lại: 1 ngày (+5 XP)
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
                          Ôn lại: 1 ngày (+5 XP)
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
                          Ôn lại: 3-7 ngày (+10 XP)
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
                          Ôn lại: 14-30 ngày (+15 XP)
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
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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

              {/* STATS BREAKDOWN */}
              <div className="flex flex-col gap-3">
                {/* Level 0-1: Learning */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đang học ban đầu
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp Leitner 0 - 1 (Cần nhắc lại hàng ngày)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {srsStats?.learning || 0} từ
                  </span>
                </div>

                {/* Level 2-3: Reviewing */}
                <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-sky-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đang ôn củng cố
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp Leitner 2 - 3 (Chu kỳ 3 đến 7 ngày)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
                    {srsStats?.reviewing || 0} từ
                  </span>
                </div>

                {/* Level 4: Mastered */}
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Đã thành thạo
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Hộp Leitner 4 (Lưu vào trí nhớ dài hạn)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {srsStats?.mastered || 0} từ
                  </span>
                </div>
              </div>

              {/* Total Reviewed Summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Tổng số từ trong bộ nhớ SRS:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {srsStats?.totalReviewed || 0} từ vựng
                </span>
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
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 flex items-center justify-between transition group"
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
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 flex items-center justify-between transition group"
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
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 flex items-center justify-between transition group"
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
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
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
              <table className="w-full text-left text-xs">
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
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition"
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
