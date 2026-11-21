/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang chi tiết bài học ngữ pháp: Công thức, Ví dụ, Lỗi sai, Bài giảng, Thực hành bài tập, Thống kê lớp & Chế độ Trình chiếu (Presentation Mode)
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  ListChecks,
  MonitorPlay,
  RotateCw,
  Send,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  X,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import {
  GrammarEditorModal,
  GrammarExerciseItem,
  GrammarLessonData,
  GrammarStructureItem,
} from "../../../components/GrammarEditorModal";
import { AssignGrammarModal } from "../../../components/AssignGrammarModal";
import { useAuth } from "../../../context/auth-context";
import { fetchApi } from "../../../lib/api-client";
import { speakText } from "../../../lib/speech";

interface GrammarLesson extends GrammarLessonData {
  _id: string;
  slug: string;
  status?: "draft" | "published";
  usage: string[];
  signals: string[];
  examples: Array<{ en: string; vi: string; note?: string }>;
  commonMistakes: Array<{ wrong: string; correct: string; reason: string }>;
  exercises?: GrammarExerciseItem[];
  content: string;
  order: number;
  isCompleted?: boolean;
  bestScore?: number | null;
  lastScore?: number | null;
  practiceAttempts?: number;
}

interface ClassProgressData {
  lessonId: string;
  lessonTitle: string;
  classrooms: Array<{
    classroomId: string;
    name: string;
    code: string;
    isAssigned: boolean;
    dueDate: string | null;
    completedStudents: number;
    totalStudents: number;
    avgScore: number | null;
    students: Array<{
      studentId: string;
      fullName: string;
      email: string;
      avatar: string | null;
      isCompleted: boolean;
      completedAt: string | null;
      practiceAttempts: number;
      bestScore: number | null;
      lastScore: number | null;
      lastPracticedAt: string | null;
    }>;
  }>;
}

interface PracticeSubmitResult {
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
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "formula" | "usage" | "mistakes" | "guide" | "practice" | "classStats"
  >("formula");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Practice Exercises state
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceSubmitting, setPracticeSubmitting] = useState<boolean>(false);
  const [practiceResult, setPracticeResult] = useState<PracticeSubmitResult | null>(null);

  // Teacher Class Progress state
  const [classProgress, setClassProgress] = useState<ClassProgressData | null>(null);
  const [classProgressLoading, setClassProgressLoading] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  // Teacher Modals
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);

  // Presentation Mode (Chế độ Trình chiếu)
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [revealedFormulas, setRevealedFormulas] = useState<Record<string, boolean>>({
    positive: true,
    negative: true,
    question: true,
  });
  const [revealedExamples, setRevealedExamples] = useState<Record<number, boolean>>({});
  const [revealedMistakes, setRevealedMistakes] = useState<Record<number, boolean>>({});
  const [revealedExercises, setRevealedExercises] = useState<Record<number, boolean>>({});

  const loadLesson = useCallback(async () => {
    if (!idOrSlug) return;
    setLoading(true);
    try {
      const res = await fetchApi<GrammarLesson>(`/grammar/${idOrSlug}`);
      if (res.success && res.data) {
        setLesson(res.data);
        setIsCompleted(!!res.data.isCompleted);
        if (isAuthenticated && res.data.isCompleted === undefined) {
          const progRes = await fetchApi<{ completedLessonIds: string[] }>("/grammar/progress");
          if (progRes.success && progRes.data?.completedLessonIds) {
            setIsCompleted(progRes.data.completedLessonIds.includes(res.data._id));
          }
        }
      } else {
        setLesson(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài học ngữ pháp:", err);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  }, [idOrSlug, isAuthenticated]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  // Load class progress when Teacher opens Thống kê lớp tab
  const loadClassProgress = useCallback(async () => {
    if (!lesson?._id || !isTeacherOrAdmin) return;
    setClassProgressLoading(true);
    try {
      const res = await fetchApi<ClassProgressData>(`/grammar/${lesson._id}/class-progress`);
      if (res.success && res.data) {
        setClassProgress(res.data);
        if (!selectedClassId && res.data.classrooms.length > 0) {
          const assignedFirst =
            res.data.classrooms.find((c) => c.isAssigned) || res.data.classrooms[0];
          setSelectedClassId(assignedFirst.classroomId);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê lớp:", err);
    } finally {
      setClassProgressLoading(false);
    }
  }, [lesson?._id, isTeacherOrAdmin, selectedClassId]);

  useEffect(() => {
    if (activeTab === "classStats") {
      loadClassProgress();
    }
  }, [activeTab, loadClassProgress]);

  // Keyboard shortcuts for Presentation Mode
  useEffect(() => {
    if (!presentationMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPresentationMode(false);
      } else if (e.key === "ArrowRight") {
        setSlideIndex((prev) => Math.min(4, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presentationMode]);

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
        { method: "POST" }
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

  const handleSubmitPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!lesson || !lesson.exercises?.length) return;

    setPracticeSubmitting(true);
    try {
      const answers = lesson.exercises.map((_, idx) => ({
        questionIndex: idx,
        answer: practiceAnswers[idx] || "",
      }));

      const res = await fetchApi<PracticeSubmitResult>(
        `/grammar/${lesson._id}/submit-practice`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      );

      if (res.success && res.data) {
        setPracticeResult(res.data);
        if (res.data.score >= 50) setIsCompleted(true);
        setLesson((prev) =>
          prev
            ? {
                ...prev,
                bestScore: res.data!.bestScore,
                lastScore: res.data!.score,
                practiceAttempts: (prev.practiceAttempts || 0) + 1,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Lỗi khi nộp bài thực hành:", err);
    } finally {
      setPracticeSubmitting(false);
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
            Bài học bạn tìm kiếm không tồn tại, đang ở chế độ nháp hoặc đã bị gỡ khỏi hệ thống.
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

  const exercises = lesson.exercises || [];
  const activeClassroom = classProgress?.classrooms.find(
    (c) => c.classroomId === selectedClassId
  );

  const LIGHT_THEMES: Record<string, { box: string; badge: string; title: string }> = {
    emerald: {
      box: "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-600",
      title: "text-emerald-900 dark:text-emerald-300",
    },
    rose: {
      box: "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
      badge: "bg-rose-600",
      title: "text-rose-900 dark:text-rose-300",
    },
    sky: {
      box: "bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800",
      badge: "bg-sky-600",
      title: "text-sky-900 dark:text-sky-300",
    },
    amber: {
      box: "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
      badge: "bg-amber-500",
      title: "text-amber-900 dark:text-amber-300",
    },
    indigo: {
      box: "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800",
      badge: "bg-indigo-600",
      title: "text-indigo-900 dark:text-indigo-300",
    },
    purple: {
      box: "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
      badge: "bg-purple-600",
      title: "text-purple-900 dark:text-purple-300",
    },
  };

  const DARK_THEMES: Record<string, { box: string; badge: string }> = {
    emerald: { box: "bg-emerald-950/60 border-emerald-500/50 text-emerald-300", badge: "bg-emerald-500" },
    rose: { box: "bg-rose-950/60 border-rose-500/50 text-rose-300", badge: "bg-rose-500" },
    sky: { box: "bg-sky-950/60 border-sky-500/50 text-sky-300", badge: "bg-sky-500" },
    amber: { box: "bg-amber-950/60 border-amber-500/50 text-amber-300", badge: "bg-amber-500" },
    indigo: { box: "bg-indigo-950/60 border-indigo-500/50 text-indigo-300", badge: "bg-indigo-500" },
    purple: { box: "bg-purple-950/60 border-purple-500/50 text-purple-300", badge: "bg-purple-500" },
  };

  const lessonStructures: GrammarStructureItem[] =
    Array.isArray(lesson.structures) && lesson.structures.length > 0
      ? lesson.structures
      : [
          ...(lesson.formula?.positive
            ? [{ badge: "+", label: "Thể Khẳng định (Affirmative)", pattern: lesson.formula.positive, color: "emerald" }]
            : []),
          ...(lesson.formula?.negative
            ? [{ badge: "-", label: "Thể Phủ định (Negative)", pattern: lesson.formula.negative, color: "rose" }]
            : []),
          ...(lesson.formula?.question
            ? [{ badge: "?", label: "Thể Nghi vấn (Interrogative)", pattern: lesson.formula.question, color: "sky" }]
            : []),
        ];

  const PRESENTATION_SLIDES = [
    "1. Công thức & Cấu trúc",
    "2. Cách dùng & Dấu hiệu",
    "3. Ví dụ song ngữ",
    "4. Lỗi thường gặp",
    "5. Thực hành cùng lớp",
  ];

  return (
    <AppLayout>
      {/* FULLSCREEN PRESENTATION MODE (CHẾ ĐỘ TRÌNH CHIẾU) */}
      {presentationMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
          {/* Top Presentation Toolbar */}
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase">
                CEFR {lesson.level}
              </span>
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                {lesson.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {PRESENTATION_SLIDES.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`hidden md:inline-flex px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    slideIndex === idx
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPresentationMode(false)}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <X className="size-4" /> Thoát trình chiếu (Esc)
              </button>
            </div>
          </div>

          {/* Enlarged Slide Canvas */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-14 py-8 flex flex-col justify-center max-w-6xl mx-auto w-full">
            {slideIndex === 0 && (
              <div className="flex flex-col gap-6">
                <div className="text-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    {lesson.category}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-white mt-2">
                    {lesson.title}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-3xl mx-auto">
                    {lesson.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {lessonStructures.map((item, idx) => {
                    const key = `st-${idx}`;
                    const visible = revealedFormulas[key] ?? true;
                    const theme = DARK_THEMES[item.color || "emerald"] || DARK_THEMES.emerald;
                    return (
                      <div
                        key={key}
                        className={`p-6 sm:p-7 rounded-3xl border-2 flex items-center justify-between gap-4 ${theme.box}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span
                            className={`size-11 rounded-2xl ${theme.badge} text-white text-xl font-black flex items-center justify-center shrink-0`}
                          >
                            {item.badge || idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold uppercase opacity-85">
                              {item.label}
                            </div>
                            <div className="text-xl sm:text-3xl font-mono font-black text-white mt-1 break-words">
                              {visible ? item.pattern : "•••••••••••••• (Đang ẩn để học sinh trả lời)"}
                            </div>
                            {visible && item.note && (
                              <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
                                💡 {item.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setRevealedFormulas((prev) => ({ ...prev, [key]: !visible }))
                          }
                          className="h-10 px-4 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          <span>{visible ? "Ẩn" : "Hiện"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {slideIndex === 1 && (
              <div className="flex flex-col gap-8">
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Cách dùng chính &amp; Dấu hiệu nhận biết
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {(lesson.usage || []).map((u, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4"
                    >
                      <span className="size-9 rounded-xl bg-emerald-500 text-white text-base font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-lg sm:text-2xl font-semibold text-slate-100 leading-relaxed">
                        {u}
                      </p>
                    </div>
                  ))}
                </div>
                {lesson.signals?.length > 0 && (
                  <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-700/50 flex flex-col gap-3">
                    <span className="text-sm font-extrabold uppercase text-amber-400">
                      Dấu hiệu nhận biết
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {lesson.signals.map((sig, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 font-mono text-base sm:text-lg font-extrabold text-amber-200"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {slideIndex === 2 && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-3xl sm:text-4xl font-black text-white">
                    Ví dụ minh họa trực tiếp
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      const anyHidden = lesson.examples.some((_, i) => !revealedExamples[i]);
                      const next: Record<number, boolean> = {};
                      lesson.examples.forEach((_, i) => {
                        next[i] = anyHidden;
                      });
                      setRevealedExamples(next);
                    }}
                    className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="size-4 text-emerald-400" />
                    <span>Hiện / Ẩn tất cả nghĩa tiếng Việt</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {lesson.examples.map((ex, idx) => {
                    const shown = !!revealedExamples[idx];
                    return (
                      <div
                        key={idx}
                        className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xl sm:text-3xl font-extrabold text-white leading-snug">
                            &quot;{ex.en}&quot;
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePronounce(ex.en)}
                              className="size-11 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center cursor-pointer"
                            >
                              <Volume2 className="size-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedExamples((prev) => ({ ...prev, [idx]: !shown }))
                              }
                              className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              <span>{shown ? "Ẩn nghĩa" : "Hiện nghĩa"}</span>
                            </button>
                          </div>
                        </div>

                        {shown && (
                          <div className="pt-2 border-t border-slate-800 text-lg sm:text-xl text-emerald-300 font-semibold">
                            👉 {ex.vi}{" "}
                            {ex.note && (
                              <span className="text-sm text-slate-400 font-normal ml-2">
                                ({ex.note})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {slideIndex === 3 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Phân tích lỗi sai thường gặp (Tìm lỗi sai!)
                </h2>
                <div className="flex flex-col gap-4">
                  {lesson.commonMistakes.map((m, idx) => {
                    const shown = !!revealedMistakes[idx];
                    return (
                      <div
                        key={idx}
                        className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-extrabold uppercase text-rose-400">
                              Câu sai #{idx + 1}:
                            </span>
                            <p className="text-xl sm:text-2xl font-bold text-rose-200">
                              ❌ {m.wrong}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedMistakes((prev) => ({ ...prev, [idx]: !shown }))
                            }
                            className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            <span>{shown ? "Ẩn đáp án sửa" : "Hiện câu đúng & Giải thích"}</span>
                          </button>
                        </div>

                        {shown && (
                          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col gap-1.5">
                            <p className="text-lg sm:text-2xl font-extrabold text-emerald-300">
                              ✅ {m.correct}
                            </p>
                            <p className="text-sm sm:text-base text-slate-200">
                              💡 {m.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {slideIndex === 4 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Thực hành nhanh cùng cả lớp ({exercises.length} câu)
                </h2>
                {exercises.length === 0 ? (
                  <p className="text-lg text-slate-400">
                    Bài học này chưa có câu hỏi thực hành. Hãy thoát trình chiếu và dùng AI sinh bài tập!
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {exercises.map((ex, idx) => {
                      const shown = !!revealedExercises[idx];
                      return (
                        <div
                          key={idx}
                          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-lg sm:text-2xl font-extrabold text-white">
                              Câu {idx + 1}: {ex.question}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedExercises((prev) => ({ ...prev, [idx]: !shown }))
                              }
                              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              <span>{shown ? "Ẩn đáp án" : "Hiện đáp án"}</span>
                            </button>
                          </div>

                          {ex.type === "mcq" && ex.options && ex.options.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {ex.options.map((opt, oIdx) => {
                                const isRight = shown && opt === ex.correctAnswer;
                                return (
                                  <div
                                    key={oIdx}
                                    className={`px-4 py-2.5 rounded-xl border text-sm sm:text-base font-bold ${
                                      isRight
                                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                                        : "bg-slate-800/70 border-slate-700 text-slate-200"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}. {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {shown && (
                            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-sm sm:text-base text-emerald-200">
                              <strong>Đáp án đúng:</strong> {ex.correctAnswer}
                              {ex.explanation ? ` — ${ex.explanation}` : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Presentation Slide Controls */}
          <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((p) => Math.max(0, p - 1))}
              className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Slide trước
            </button>

            <span className="text-xs sm:text-sm font-extrabold text-slate-400">
              Slide {slideIndex + 1} / {PRESENTATION_SLIDES.length} — {PRESENTATION_SLIDES[slideIndex]}
            </span>

            <button
              type="button"
              disabled={slideIndex === PRESENTATION_SLIDES.length - 1}
              onClick={() =>
                setSlideIndex((p) => Math.min(PRESENTATION_SLIDES.length - 1, p + 1))
              }
              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              Slide tiếp theo <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col gap-6">
        {/* Breadcrumb Navigation + Presentation / Teacher Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/grammar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ChevronLeft className="size-4" /> Danh mục ngữ pháp
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {isTeacherOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSlideIndex(0);
                    setPresentationMode(true);
                  }}
                  className="h-9.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <MonitorPlay className="size-4" />
                  <span>Trình chiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(true)}
                  className="h-9.5 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Send className="size-3.5" />
                  <span>Giao cho lớp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="h-9.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Edit2 className="size-3.5 text-emerald-600" />
                  <span>Chỉnh sửa</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lesson Hero Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
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
              {lesson.status === "draft" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300">
                  <EyeOff className="size-3" /> Bản nháp (Chưa mở khóa)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {lesson.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {lesson.summary}
            </p>
          </div>

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
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center sm:text-right">
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
            <Compass className="size-4" /> Cấu trúc &amp; Công thức
          </button>

          <button
            onClick={() => setActiveTab("usage")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "usage"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="size-4" /> Cách dùng &amp; Ví dụ ({lesson.examples?.length || 0})
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

          <button
            onClick={() => setActiveTab("practice")}
            className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "practice"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ListChecks className="size-4" /> Thực hành ({exercises.length})
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => setActiveTab("classStats")}
              className={`h-11 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "classStats"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users className="size-4" /> Thống kê lớp
            </button>
          )}
        </div>

        {/* TAB 1: FORMULA & STRUCTURES */}
        {activeTab === "formula" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Compass className="size-5 text-emerald-600" /> Công thức &amp; Cấu trúc ngữ pháp
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {lessonStructures.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Chưa cập nhật công thức cho bài học này.
                  </p>
                ) : (
                  lessonStructures.map((st, idx) => {
                    const theme = LIGHT_THEMES[st.color || "emerald"] || LIGHT_THEMES.emerald;
                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-1.5 ${theme.box}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-6 rounded-full ${theme.badge} text-white flex items-center justify-center text-xs font-black shrink-0`}
                          >
                            {st.badge || idx + 1}
                          </span>
                          <span className={`text-xs font-bold uppercase tracking-wide ${theme.title}`}>
                            {st.label}
                          </span>
                        </div>
                        <code className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100 pl-8 break-words">
                          {st.pattern}
                        </code>
                        {st.note && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 pl-8">
                            💡 {st.note}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

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
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">
                          ❌ Sai (Wrong):
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 line-through">
                          {m.wrong}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          ✅ Đúng (Correct):
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          {m.correct}
                        </span>
                      </div>
                    </div>

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
              <FileText className="size-5 text-emerald-600" /> Bài giảng &amp; Quy tắc chuyên sâu
            </h2>
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {lesson.content || "Chưa có nội dung bổ sung cho bài giảng này."}
            </div>
          </div>
        )}

        {/* TAB 5: PRACTICE EXERCISES */}
        {activeTab === "practice" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ListChecks className="size-5 text-emerald-600" /> Bài tập thực hành ({exercises.length} câu)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra nhanh kiến thức ngay sau khi học lý thuyết (đạt từ 50% tự động đánh dấu hoàn thành).
                </p>
              </div>
              {typeof lesson.bestScore === "number" && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold">
                  Điểm cao nhất: {lesson.bestScore}%
                </span>
              )}
            </div>

            {exercises.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center gap-3">
                <ListChecks className="size-10 text-slate-300 dark:text-slate-700" />
                <p className="text-xs text-slate-500">
                  Bài học này chưa có câu hỏi bài tập thực hành đi kèm.
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="size-3.5" /> Mở trình soạn bài để AI sinh câu hỏi
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitPractice} className="flex flex-col gap-4">
                {practiceResult && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="size-8 text-amber-500" />
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Kết quả: {practiceResult.correctCount}/{practiceResult.totalCount} câu đúng ({practiceResult.score}%)
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Điểm cao nhất: {practiceResult.bestScore}%
                          {practiceResult.xpEarned > 0
                            ? ` • Thưởng +${practiceResult.xpEarned} XP!`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPracticeResult(null);
                        setPracticeAnswers({});
                      }}
                      className="h-9.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="size-3.5" /> Làm lại
                    </button>
                  </div>
                )}

                {exercises.map((ex, idx) => {
                  const resItem = practiceResult?.results.find(
                    (r) => r.questionIndex === idx
                  );
                  const chosen = practiceAnswers[idx] || "";

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          <span className="text-emerald-600 mr-1.5">Câu {idx + 1}.</span>
                          {ex.question}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-[10px] font-bold uppercase shrink-0">
                          {ex.type === "mcq" ? "Trắc nghiệm" : "Điền từ"}
                        </span>
                      </div>

                      {ex.type === "mcq" && ex.options && ex.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {ex.options.map((opt, oIdx) => {
                            const selected = chosen === opt;
                            let optStyle =
                              "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-500";
                            if (resItem) {
                              if (opt === resItem.correctAnswer) {
                                optStyle =
                                  "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200";
                              } else if (selected && !resItem.isCorrect) {
                                optStyle =
                                  "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-200";
                              }
                            } else if (selected) {
                              optStyle =
                                "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500";
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={!!practiceResult}
                                onClick={() =>
                                  setPracticeAnswers((prev) => ({ ...prev, [idx]: opt }))
                                }
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${optStyle}`}
                              >
                                <span className="size-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-black shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled={!!practiceResult}
                          placeholder="Nhập đáp án vào chỗ trống..."
                          value={chosen}
                          onChange={(e) =>
                            setPracticeAnswers((prev) => ({ ...prev, [idx]: e.target.value }))
                          }
                          className="h-10.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold"
                        />
                      )}

                      {resItem && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            resItem.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                              : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200"
                          }`}
                        >
                          <strong>
                            {resItem.isCorrect
                              ? "✅ Chính xác!"
                              : `❌ Chưa đúng! Đáp án đúng: ${resItem.correctAnswer}`}
                          </strong>
                          {resItem.explanation && (
                            <span className="block mt-1 opacity-90">{resItem.explanation}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!practiceResult && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={practiceSubmitting}
                      className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/25 cursor-pointer transition"
                    >
                      {practiceSubmitting ? "Đang chấm điểm..." : "Nộp bài thực hành"}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* TAB 6 (TEACHER/ADMIN): THỐNG KÊ LỚP */}
        {activeTab === "classStats" && isTeacherOrAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Users className="size-5" /> Theo dõi tiến độ học sinh theo lớp
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xem học sinh nào đã đọc xong, ai chưa học và điểm bài tập thực hành của từng em.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="size-3.5" /> Giao bài cho lớp
              </button>
            </div>

            {classProgressLoading ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Đang tải dữ liệu lớp học...
              </div>
            ) : !classProgress || classProgress.classrooms.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                Bạn chưa quản lý lớp học nào. Hãy tạo lớp tại mục <strong>Lớp học</strong> để theo dõi tiến độ từng học sinh.
              </div>
            ) : (
              <>
                {/* Classroom Pills */}
                <div className="flex flex-wrap gap-2">
                  {classProgress.classrooms.map((cls) => (
                    <button
                      key={cls.classroomId}
                      type="button"
                      onClick={() => setSelectedClassId(cls.classroomId)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                        selectedClassId === cls.classroomId
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <span>{cls.name}</span>
                      <span className="opacity-75">
                        ({cls.completedStudents}/{cls.totalStudents})
                      </span>
                      {cls.isAssigned && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px]">
                          Đã giao
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {activeClassroom && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Mã lớp
                        </span>
                        <span className="text-sm font-extrabold">{activeClassroom.code}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Đã đọc xong
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600">
                          {activeClassroom.completedStudents}/{activeClassroom.totalStudents} học sinh
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Điểm thực hành TB
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600">
                          {activeClassroom.avgScore !== null ? `${activeClassroom.avgScore}%` : "Chưa có"}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Trạng thái giao bài
                        </span>
                        <span className="text-xs font-extrabold">
                          {activeClassroom.isAssigned && activeClassroom.dueDate
                            ? `Hạn: ${new Date(activeClassroom.dueDate).toLocaleDateString("vi-VN")}`
                            : "Chưa giao cho lớp này"}
                        </span>
                      </div>
                    </div>

                    {activeClassroom.students.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">
                        Lớp học này chưa có học sinh tham gia.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[11px]">
                            <tr>
                              <th className="py-3 px-4 font-bold">Học sinh</th>
                              <th className="py-3 px-4 font-bold">Trạng thái đọc bài</th>
                              <th className="py-3 px-4 font-bold">Điểm thực hành</th>
                              <th className="py-3 px-4 font-bold">Số lần làm</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeClassroom.students.map((st) => (
                              <tr key={st.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {st.fullName}
                                  </div>
                                  <div className="text-[11px] text-slate-400">{st.email}</div>
                                </td>
                                <td className="py-3 px-4">
                                  {st.isCompleted ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                                      <CheckCircle2 className="size-3" /> Đã đọc xong
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                      Chưa học
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-extrabold">
                                  {st.bestScore !== null ? (
                                    <span
                                      className={
                                        st.bestScore >= 50 ? "text-emerald-600" : "text-rose-600"
                                      }
                                    >
                                      {st.bestScore}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">Chưa làm</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                  {st.practiceAttempts} lần
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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

        {/* Modals */}
        <GrammarEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          editingLesson={lesson}
          onSaved={() => {
            loadLesson();
            setNotification("Đã cập nhật bài học ngữ pháp!");
            setTimeout(() => setNotification(null), 4000);
          }}
        />

        <AssignGrammarModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          lesson={lesson}
          onAssigned={(msg) => {
            setNotification(msg);
            setTimeout(() => setNotification(null), 4500);
            if (activeTab === "classStats") loadClassProgress();
          }}
        />
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
