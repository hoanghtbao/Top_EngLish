/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang chi tiết bài học ngữ pháp trực quan với 4 tab (Công thức, Cách dùng & Ví dụ phát âm, Lỗi thường gặp, Bài giảng chuyên sâu)
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { useAuth } from "../../../context/auth-context";
import { fetchApi } from "../../../lib/api-client";
import { speakText } from "../../../lib/speech";

interface GrammarExample {
  en: string;
  vi: string;
  note?: string;
}

interface CommonMistake {
  wrong: string;
  correct: string;
  reason: string;
}

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
  usage: string[];
  signals: string[];
  examples: GrammarExample[];
  commonMistakes: CommonMistake[];
  content: string;
  order: number;
}

function GrammarDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex">
      <div className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen shrink-0" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80" />
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Đang nạp bài giảng ngữ pháp...
          </p>
        </div>
      </div>
    </div>
  );
}

function GrammarDetailInner() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params?.id as string;
  const { user, isAuthenticated } = useAuth();

  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"formula" | "usage" | "mistakes" | "guide">("formula");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Tải thông tin bài học và trạng thái hoàn thành
  useEffect(() => {
    if (!idOrSlug) return;

    const loadLesson = async () => {
      setLoading(true);
      try {
        const res = await fetchApi<GrammarLesson>(`/grammar/${idOrSlug}`);
        if (res.success && res.data) {
          setLesson(res.data);

          // Kiểm tra nếu người dùng đã hoàn thành bài học này
          if (isAuthenticated) {
            const progRes = await fetchApi<{ completedLessonIds: string[] }>("/grammar/progress");
            if (progRes.success && progRes.data?.completedLessonIds) {
              setIsCompleted(progRes.data.completedLessonIds.includes(res.data._id));
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải bài học ngữ pháp:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [idOrSlug, isAuthenticated]);

  const handleToggleComplete = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!lesson) return;

    setActionLoading(true);
    try {
      const res = await fetchApi<{ isCompleted: boolean; xpEarned: number; message: string }>(
        `/grammar/progress/${lesson._id}/toggle`,
        {
          method: "POST",
        }
      );

      if (res.success && res.data) {
        setIsCompleted(res.data.isCompleted);
        setNotification(res.data.message);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error("Lỗi cập nhật tiến độ:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePronounce = useCallback(async (text: string) => {
    if (!text) return;
    await speakText(text);
  }, []);

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

  if (loading) {
    return <GrammarDetailSkeleton />;
  }

  if (!lesson) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Không tìm thấy bài học ngữ pháp</h2>
          <p className="text-xs text-slate-500">
            Bài học bạn tìm kiếm không tồn tại hoặc đã bị gỡ khỏi hệ thống.
          </p>
          <Link
            href="/grammar"
            className="h-11 px-5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Quay lại danh mục ngữ pháp
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col gap-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/grammar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ChevronLeft className="size-4" /> Danh mục ngữ pháp
          </Link>

          <span className="text-xs font-bold text-slate-400">
            Chuyên mục: <span className="text-slate-700 dark:text-slate-300">{lesson.category}</span>
          </span>
        </div>

        {/* Lesson Hero Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase shadow-xs ${getLevelBadge(
                  lesson.level
                )}`}
              >
                <GraduationCap className="size-3" /> CEFR {lesson.level}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Compass className="size-3" /> {lesson.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {lesson.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {lesson.summary}
            </p>
          </div>

          {/* Complete Status Action */}
          <div className="w-full sm:w-auto shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            <button
              onClick={handleToggleComplete}
              disabled={actionLoading}
              className={`h-12 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Đã hoàn thành bài học</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Đánh dấu đã hiểu (+20 XP)</span>
                </>
              )}
            </button>

            {notification && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in text-center sm:text-right">
                {notification}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("formula")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "formula"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Compass className="size-4" /> Cấu trúc & Công thức
          </button>

          <button
            onClick={() => setActiveTab("usage")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "usage"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="size-4" /> Cách dùng & Ví dụ ({lesson.examples?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("mistakes")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "mistakes"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="size-4" /> Lỗi thường gặp ({lesson.commonMistakes?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "guide"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="size-4" /> Bài giảng chi tiết
          </button>
        </div>

        {/* TAB 1: FORMULA & STRUCTURES */}
        {activeTab === "formula" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Compass className="size-5 text-emerald-600" /> Công thức ngữ pháp 3 thể
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {/* Khẳng định */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      +
                    </span>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                      Thể Khẳng định (Affirmative)
                    </span>
                  </div>
                  <code className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100 pl-8">
                    {lesson.formula?.positive || "Chưa cập nhật"}
                  </code>
                </div>

                {/* Phủ định */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black">
                      -
                    </span>
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide">
                      Thể Phủ định (Negative)
                    </span>
                  </div>
                  <code className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100 pl-8">
                    {lesson.formula?.negative || "Chưa cập nhật"}
                  </code>
                </div>

                {/* Nghi vấn */}
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-black">
                      ?
                    </span>
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wide">
                      Thể Nghi vấn (Interrogative)
                    </span>
                  </div>
                  <code className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100 pl-8">
                    {lesson.formula?.question || "Chưa cập nhật"}
                  </code>
                </div>
              </div>
            </div>

            {/* Signals / Keywords */}
            {lesson.signals && lesson.signals.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" /> Dấu hiệu nhận biết đặc trưng
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.signals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono text-xs font-bold"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USAGE & EXAMPLES */}
        {activeTab === "usage" && (
          <div className="flex flex-col gap-6">
            {/* Usages */}
            {lesson.usage && lesson.usage.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
                <h2 className="text-lg font-bold">Các trường hợp sử dụng chính</h2>
                <div className="flex flex-col gap-3">
                  {lesson.usage.map((u, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3"
                    >
                      <span className="size-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {u}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples with Audio */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Volume2 className="size-5 text-emerald-600" /> Ví dụ minh họa thực tế (Web Speech API)
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {lesson.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          &quot;{ex.en}&quot;
                        </p>
                        <button
                          onClick={() => handlePronounce(ex.en)}
                          className="size-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition cursor-pointer shrink-0"
                          title="Phát âm câu ví dụ này"
                        >
                          <Volume2 className="size-4" />
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        👉 {ex.vi}
                      </p>

                      {ex.note && (
                        <div className="mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="size-3" />
                          <span>Ghi chú: {ex.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMON MISTAKES */}
        {activeTab === "mistakes" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="size-5" /> Phân tích lỗi sai thường gặp
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhớ các bẫy ngữ pháp phổ biến người học tiếng Anh hay mắc phải để tránh mất điểm trong bài thi.
              </p>
            </div>

            {lesson.commonMistakes && lesson.commonMistakes.length > 0 ? (
              <div className="flex flex-col gap-4">
                {lesson.commonMistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Wrong */}
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">
                          ❌ Sai (Wrong):
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 line-through">
                          {m.wrong}
                        </span>
                      </div>

                      {/* Correct */}
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          ✅ Đúng (Correct):
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          {m.correct}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">Tại sao?</strong> {m.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Chưa có dữ liệu lỗi sai được ghi nhận cho bài học này.
              </p>
            )}
          </div>
        )}

        {/* TAB 4: DEEP DIVE GUIDE */}
        {activeTab === "guide" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="size-5 text-emerald-600" /> Bài giảng & Quy tắc chuyên sâu
            </h2>
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {lesson.content || "Chưa có nội dung bổ sung cho bài giảng này."}
            </div>
          </div>
        )}

        {/* Bottom Navigation & Complete Prompt */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/grammar"
            className="h-11 px-5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <ChevronLeft className="size-4" /> Về danh mục bài học
          </Link>

          <button
            onClick={handleToggleComplete}
            disabled={actionLoading}
            className={`h-11 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer w-full sm:w-auto ${
              isCompleted
                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25"
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>{isCompleted ? "Đã đánh dấu hoàn thành" : "Hoàn thành bài học (+20 XP)"}</span>
          </button>
        </div>
      </main>
    </AppLayout>
  );
}

export default function GrammarDetailPage() {
  return (
    <Suspense fallback={<GrammarDetailSkeleton />}>
      <GrammarDetailInner />
    </Suspense>
  );
}
