/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh mục bài học ngữ pháp (Grammar Catalog) phân loại theo chuyên đề và cấp độ CEFR
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
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

interface GrammarLesson {
  _id: string;
  title: string;
  slug: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  category: string;
  summary: string;
  formula?: {
    positive?: string;
    negative?: string;
    question?: string;
  };
  order: number;
}

interface GrammarCategory {
  category: string;
  count: number;
}

interface UserProgress {
  completedCount: number;
  totalLessons: number;
  completionPercentage: number;
  completedLessonIds: string[];
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

export default function GrammarCatalogPage() {
  const { user, isAuthenticated } = useAuth();

  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [categories, setCategories] = useState<GrammarCategory[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tải danh mục chuyên mục và tiến độ học viên
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        // Tải danh sách category
        const catRes = await fetchApi<GrammarCategory[]>("/grammar/categories");
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }

        // Tải tiến độ nếu đã đăng nhập
        if (isAuthenticated) {
          const progRes = await fetchApi<UserProgress>("/grammar/progress");
          if (progRes.success && progRes.data) {
            setProgress(progRes.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải metadata ngữ pháp:", err);
      }
    };

    fetchMeta();
  }, [isAuthenticated]);

  // Tải danh sách bài học ngữ pháp theo bộ lọc
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();

        if (selectedCategory !== "ALL") {
          queryParams.append("category", selectedCategory);
        }
        if (selectedLevel !== "ALL") {
          queryParams.append("level", selectedLevel);
        }
        if (searchQuery.trim()) {
          queryParams.append("search", searchQuery.trim());
        }

        const res = await fetchApi<GrammarLesson[]>(`/grammar?${queryParams.toString()}`);
        if (res.success && Array.isArray(res.data)) {
          setLessons(res.data);
        } else {
          setLessons([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách bài học ngữ pháp:", err);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLessons();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedLevel, searchQuery]);

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
            Module 6: Hệ thống bài học ngữ pháp chuẩn CEFR
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Chuyên mục Ngữ pháp tiếng Anh
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Học ngữ pháp trực quan qua công thức 3 cấu trúc (+, -, ?), các ví dụ song ngữ thực tế, dấu hiệu nhận biết và bảng phân tích lỗi sai thường gặp.
          </p>
        </div>

        {/* User Progress Banner if Authenticated */}
        {isAuthenticated && progress && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Trophy className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Tiến độ học tập của bạn
                </span>
                <span className="text-sm sm:text-base font-extrabold">
                  Đã hoàn thành {progress.completedCount} / {progress.totalLessons} bài học ngữ pháp ({progress.completionPercentage}%)
                </span>
              </div>
            </div>

            <div className="w-full sm:w-48 flex flex-col gap-1.5">
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-right text-slate-500 font-medium">
                {progress.completionPercentage}% hoàn thành lộ trình
              </span>
            </div>
          </div>
        )}

        {/* Filters & Search Control Bar */}
        <div className="flex flex-col gap-4 mb-8 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Row 1: Categories filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
              <Compass className="size-3.5" /> Chuyên đề:
            </span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Tất cả chuyên đề
            </button>
            {categories.map((c) => (
              <button
                key={c.category}
                onClick={() => setSelectedCategory(c.category)}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.category
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {c.category} ({c.count})
              </button>
            ))}
          </div>

          {/* Row 2: CEFR Level and Search */}
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
                id="search-grammar"
                type="text"
                placeholder="Tìm kiếm bài học ngữ pháp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Grammar Lessons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <BookOpen className="size-7" />
            </div>
            <h3 className="text-lg font-bold">Không tìm thấy bài học phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Không có bài học ngữ pháp nào phù hợp với bộ lọc đã chọn. Hãy thử xóa tìm kiếm hoặc bộ lọc.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedLevel("ALL");
                setSearchQuery("");
              }}
              className="mt-2 h-11 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Xem tất cả bài học
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.map((lesson) => {
              const isCompleted =
                progress?.completedLessonIds.includes(lesson._id) || false;

              return (
                <div
                  key={lesson._id}
                  className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col gap-3">
                    {/* Badges Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase shadow-xs ${getLevelBadge(
                            lesson.level
                          )}`}
                        >
                          <GraduationCap className="size-3" /> CEFR {lesson.level}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Layers className="size-3" /> {lesson.category}
                        </span>
                      </div>

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="size-3.5" /> Đã học
                        </span>
                      )}
                    </div>

                    {/* Lesson Title */}
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      {lesson.title}
                    </h2>

                    {/* Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {lesson.summary}
                    </p>

                    {/* Formula Snippet Preview */}
                    {lesson.formula?.positive && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Cấu trúc khẳng định:
                        </span>
                        <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {lesson.formula.positive}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Lộ trình bài #{lesson.order || 1}
                    </span>
                    <Link
                      href={`/grammar/${lesson.slug || lesson._id}`}
                      className="h-10 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-emerald-600 group-hover:text-white shadow-xs"
                    >
                      <span>Vào học bài</span>
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
