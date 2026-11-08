/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh sách đề thi trắc nghiệm & bài tập thực hành (Quizzes Catalog)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  type: "vocabulary" | "grammar" | "general";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  topicId?: { _id: string; title: string; slug: string };
  grammarLessonId?: { _id: string; title: string; slug: string };
}

interface Submission {
  _id: string;
  quizId: { _id: string };
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  xpEarned: number;
  createdAt: string;
}

const CEFR_LEVELS = [
  { key: "ALL", label: "Tất cả cấp độ" },
  { key: "A1", label: "A1" },
  { key: "A2", label: "A2" },
  { key: "B1", label: "B1" },
  { key: "B2", label: "B2" },
  { key: "C1", label: "C1" },
  { key: "C2", label: "C2" },
];

export default function QuizzesCatalogPage() {
  const { user, isAuthenticated } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tải lịch sử làm bài nếu đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSubmissions = async () => {
      try {
        const res = await fetchApi<Submission[]>("/quizzes/my-submissions");
        if (res.success && Array.isArray(res.data)) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử bài thi:", err);
      }
    };

    fetchSubmissions();
  }, [isAuthenticated]);

  // Tải danh sách đề thi theo bộ lọc
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedType !== "ALL") {
          queryParams.append("type", selectedType);
        }
        if (selectedLevel !== "ALL") {
          queryParams.append("level", selectedLevel);
        }
        if (searchQuery.trim()) {
          queryParams.append("search", searchQuery.trim());
        }

        const res = await fetchApi<Quiz[]>(`/quizzes?${queryParams.toString()}`);
        if (res.success && Array.isArray(res.data)) {
          setQuizzes(res.data);
        } else {
          setQuizzes([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách đề thi:", err);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchQuizzes();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedType, selectedLevel, searchQuery]);

  const getBestScore = (quizId: string) => {
    const quizSubs = submissions.filter((s) => s.quizId && s.quizId._id === quizId);
    if (quizSubs.length === 0) return null;
    return quizSubs.reduce((max, s) => (s.score > max.score ? s : max), quizSubs[0]);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "A1":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "A2":
        return "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800";
      case "B1":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "B2":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
      case "C1":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800";
      case "C2":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Page Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-center sm:self-start">
            <Sparkles className="size-3.5" />
            Module 7: Bài tập & Đề thi trắc nghiệm bấm giờ
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Luyện thi & Kiểm tra kiến thức
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Thực hành củng cố vốn từ vựng và quy tắc ngữ pháp qua các bài kiểm tra trắc nghiệm và điền từ. Hệ thống tự động chấm điểm, hiển thị giải thích chi tiết và cộng điểm XP.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 mb-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Row 1: Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
              <Layers className="size-3.5" /> Phân loại:
            </span>
            <button
              onClick={() => setSelectedType("ALL")}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedType === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Tất cả đề thi
            </button>
            <button
              onClick={() => setSelectedType("vocabulary")}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedType === "vocabulary"
                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Từ vựng (Vocabulary)
            </button>
            <button
              onClick={() => setSelectedType("grammar")}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedType === "grammar"
                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Ngữ pháp (Grammar)
            </button>
          </div>

          {/* Row 2: CEFR Level & Search Input */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* CEFR Level buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
                <Filter className="size-3.5" /> Cấp độ:
              </span>
              {CEFR_LEVELS.map((lvl) => (
                <button
                  key={lvl.key}
                  onClick={() => setSelectedLevel(lvl.key)}
                  className={`h-9 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedLevel === lvl.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px] lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                id="search-quiz"
                type="text"
                placeholder="Tìm kiếm đề thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <CheckSquare className="size-7" />
            </div>
            <h3 className="text-lg font-bold">Không tìm thấy đề thi phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Không có bài kiểm tra nào khớp với bộ lọc hiện tại. Hãy thử chọn tất cả cấp độ hoặc chuyên mục khác.
            </p>
            <button
              onClick={() => {
                setSelectedType("ALL");
                setSelectedLevel("ALL");
                setSearchQuery("");
              }}
              className="mt-2 h-11 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Xem tất cả đề thi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => {
              const bestAttempt = getBestScore(quiz._id);

              return (
                <div
                  key={quiz._id}
                  className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase shadow-xs ${getLevelBadge(
                            quiz.level
                          )}`}
                        >
                          <GraduationCap className="size-3" /> CEFR {quiz.level}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {quiz.type === "vocabulary" ? (
                            <>
                              <BookOpen className="size-3" /> Từ vựng
                            </>
                          ) : (
                            <>
                              <GraduationCap className="size-3" /> Ngữ pháp
                            </>
                          )}
                        </span>
                      </div>

                      {/* Best attempt indicator */}
                      {bestAttempt && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            bestAttempt.passed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          <Trophy className="size-3" /> Điểm cao: {bestAttempt.score}%
                        </span>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      {quiz.title}
                    </h2>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {quiz.description || "Bài kiểm tra đánh giá kiến thức toàn diện."}
                    </p>

                    {/* Linked Entity Tag if any */}
                    {(quiz.topicId || quiz.grammarLessonId) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <span className="text-slate-400">Liên kết:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {quiz.topicId?.title || quiz.grammarLessonId?.title}
                        </span>
                      </div>
                    )}

                    {/* Meta stats pills */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <CheckSquare className="size-3" /> Số câu
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {quiz.totalQuestions} câu
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-0.5 border-x border-slate-200 dark:border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="size-3" /> Thời gian
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {quiz.durationMinutes} phút
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Award className="size-3" /> Điểm đỗ
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {quiz.passingScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Thưởng tới <strong className="text-amber-500 font-bold">+80 XP</strong>
                    </span>
                    <Link
                      href={`/quizzes/${quiz._id}`}
                      className="h-11 px-5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-emerald-600 group-hover:text-white shadow-xs"
                    >
                      <span>Bắt đầu làm bài</span>
                      <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
