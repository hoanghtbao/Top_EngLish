/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh mục & quản lý bài học ngữ pháp (Grammar Catalog + Teacher Authoring, Drag-Drop Reorder, Class Assign & Teaching Stats)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  GripVertical,
  Layers,
  LockOpen,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import {
  GrammarEditorModal,
  GrammarLessonData,
} from "../../components/GrammarEditorModal";
import { AssignGrammarModal } from "../../components/AssignGrammarModal";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface GrammarLesson extends GrammarLessonData {
  _id: string;
  slug: string;
  status?: "draft" | "published";
  order: number;
  isCompleted?: boolean;
  bestScore?: number | null;
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

interface TeacherStats {
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
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [categories, setCategories] = useState<GrammarCategory[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Teacher Modals & Quick Actions
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<GrammarLesson | null>(null);
  const [assignModalLesson, setAssignModalLesson] = useState<GrammarLesson | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Drag-and-drop reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const canDragReorder =
    isTeacherOrAdmin &&
    selectedCategory === "ALL" &&
    selectedLevel === "ALL" &&
    !searchQuery.trim();

  const fetchMeta = useCallback(async () => {
    try {
      const catRes = await fetchApi<GrammarCategory[]>("/grammar/categories");
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }

      if (isAuthenticated) {
        if (isTeacherOrAdmin) {
          const statsRes = await fetchApi<TeacherStats>("/grammar/teacher-stats");
          if (statsRes.success && statsRes.data) {
            setTeacherStats(statsRes.data);
          }
        } else {
          const progRes = await fetchApi<UserProgress>("/grammar/progress");
          if (progRes.success && progRes.data) {
            setProgress(progRes.data);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải metadata ngữ pháp:", err);
    }
  }, [isAuthenticated, isTeacherOrAdmin]);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== "ALL") queryParams.append("category", selectedCategory);
      if (selectedLevel !== "ALL") queryParams.append("level", selectedLevel);
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

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
  }, [selectedCategory, selectedLevel, searchQuery]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLessons();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchLessons]);

  const notifySuccess = (msg: string) => {
    setBannerMsg(msg);
    setErrorBanner(null);
    setTimeout(() => setBannerMsg(null), 4500);
  };

  const handleToggleStatus = async (lesson: GrammarLesson) => {
    setOpenMenuId(null);
    const nextStatus: "draft" | "published" =
      lesson.status === "draft" ? "published" : "draft";
    try {
      const res = await fetchApi<GrammarLesson>(`/grammar/${lesson._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.success) {
        notifySuccess(
          nextStatus === "published"
            ? `Đã mở khóa bài "${lesson.title}" cho học sinh!`
            : `Đã chuyển "${lesson.title}" về chế độ Nháp (ẩn với học sinh).`
        );
        fetchLessons();
        fetchMeta();
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể đổi trạng thái bài học.");
    }
  };

  const handleDuplicate = async (lesson: GrammarLesson) => {
    setOpenMenuId(null);
    try {
      const res = await fetchApi<GrammarLesson>(`/grammar/${lesson._id}/duplicate`, {
        method: "POST",
      });
      if (res.success && res.data) {
        notifySuccess(`Đã nhân bản bài "${lesson.title}" thành bản nháp mới!`);
        fetchLessons();
        fetchMeta();
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể nhân bản bài học.");
    }
  };

  const handleDelete = async (lesson: GrammarLesson) => {
    setOpenMenuId(null);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài ngữ pháp "${lesson.title}"?`)) {
      return;
    }
    try {
      const res = await fetchApi(`/grammar/${lesson._id}`, { method: "DELETE" });
      if (res.success) {
        notifySuccess(`Đã xóa bài ngữ pháp "${lesson.title}".`);
        fetchLessons();
        fetchMeta();
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể xóa bài học.");
    }
  };

  const handleDropReorder = async (targetId: string) => {
    if (!canDragReorder || !draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIdx = lessons.findIndex((l) => l._id === draggedId);
    const toIdx = lessons.findIndex((l) => l._id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...lessons];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const updated = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    setLessons(updated);
    setDraggedId(null);
    setDragOverId(null);

    try {
      await fetchApi("/grammar/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: updated.map((x) => x._id) }),
      });
      notifySuccess("Đã lưu thứ tự lộ trình bài học mới!");
    } catch (err: any) {
      setErrorBanner(err.message || "Không thể lưu thứ tự mới.");
      fetchLessons();
    }
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Page Header + Prominent Teacher CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-center sm:self-start">
              <Sparkles className="size-3.5" />
              Ngữ pháp tiếng Anh thông minh &amp; Tương tác lớp học
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Chuyên mục Ngữ pháp tiếng Anh
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Học ngữ pháp qua công thức 3 cấu trúc (+, -, ?), ví dụ song ngữ phát âm, lỗi sai thường gặp, trình chiếu giảng bài và bài tập thực hành.
            </p>
          </div>

          {isTeacherOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingLesson(null);
                setEditorOpen(true);
              }}
              className="h-12 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Thêm bài ngữ pháp</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {bannerMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{bannerMsg}</span>
            </div>
            <button onClick={() => setBannerMsg(null)} className="cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}
        {errorBanner && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2">
            <span>{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Top Stats Banner: Teacher Stats OR Student Progress */}
        {isAuthenticated && isTeacherOrAdmin && teacherStats ? (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Tổng số bài học
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {teacherStats.totalLessons} bài
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center shrink-0">
                <Eye className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Đang mở / Nháp
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {teacherStats.publishedCount} mở{" "}
                  <span className="text-xs font-bold text-amber-600">
                    ({teacherStats.draftCount} nháp)
                  </span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center shrink-0">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Hoàn thành TB lớp
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {teacherStats.avgCompletionRate}%{" "}
                  <span className="text-xs font-semibold text-slate-400">
                    ({teacherStats.assignedCount} lượt giao)
                  </span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Bài làm sai nhiều nhất
                </span>
                {teacherStats.hardestLesson ? (
                  <Link
                    href={`/grammar/${teacherStats.hardestLesson.slug}`}
                    className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:underline line-clamp-2"
                  >
                    {teacherStats.hardestLesson.title} ({teacherStats.hardestLesson.avgWrongRate}% sai)
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    Chưa có lượt làm bài tập
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          isAuthenticated &&
          progress && (
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
          )
        )}

        {/* Filters & Search Control Bar */}
        <div className="flex flex-col gap-4 mb-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
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

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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

        {canDragReorder && lessons.length > 1 && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <GripVertical className="size-4 text-emerald-600" />
            <span>Kéo thả trực tiếp các thẻ bài bên dưới để sắp xếp lại thứ tự Lộ trình bài #1, #2, #3...</span>
          </div>
        )}

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
                lesson.isCompleted ||
                progress?.completedLessonIds.includes(lesson._id) ||
                false;
              const isDraft = lesson.status === "draft";
              const isDragging = draggedId === lesson._id;
              const isDragTarget = dragOverId === lesson._id && draggedId !== lesson._id;

              return (
                <div
                  key={lesson._id}
                  draggable={canDragReorder}
                  onDragStart={() => canDragReorder && setDraggedId(lesson._id)}
                  onDragOver={(e) => {
                    if (!canDragReorder) return;
                    e.preventDefault();
                    setDragOverId(lesson._id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    if (!canDragReorder) return;
                    e.preventDefault();
                    handleDropReorder(lesson._id);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={`relative group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-xs transition-all duration-200 ${
                    isDraft
                      ? "border-amber-300/80 dark:border-amber-800/70 bg-amber-50/20 dark:bg-amber-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-emerald-500/50"
                  } ${isDragging ? "opacity-50 scale-[0.98]" : ""} ${
                    isDragTarget ? "ring-2 ring-emerald-500 border-emerald-500" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Badges Header + Teacher ... Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canDragReorder && (
                          <span
                            title="Kéo thả để đổi thứ tự"
                            className="p-1 -ml-1 text-slate-400 hover:text-emerald-600 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="size-4" />
                          </span>
                        )}
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
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <EyeOff className="size-3" /> Nháp (Đang ẩn)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCompleted && !isTeacherOrAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="size-3.5" /> Đã học
                          </span>
                        )}

                        {isTeacherOrAdmin && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === lesson._id ? null : lesson._id
                                )
                              }
                              aria-label="Thao tác bài học"
                              className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>

                            {openMenuId === lesson._id && (
                              <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 z-30 flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setEditingLesson(lesson);
                                    setEditorOpen(true);
                                  }}
                                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  <Edit2 className="size-3.5 text-emerald-600" /> Chỉnh sửa bài
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(lesson)}
                                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  {isDraft ? (
                                    <>
                                      <LockOpen className="size-3.5 text-emerald-600" /> Mở khóa (Xuất bản)
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="size-3.5 text-amber-600" /> Ẩn về Nháp
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(lesson)}
                                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  <Copy className="size-3.5 text-sky-600" /> Nhân bản bài
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(lesson)}
                                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" /> Xóa bài học
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                    {(lesson.structures?.[0]?.pattern || lesson.formula?.positive) && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {lesson.structures?.[0]?.label || "Cấu trúc chính"}:
                        </span>
                        <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {lesson.structures?.[0]?.pattern || lesson.formula?.positive}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                      <span>Lộ trình bài #{lesson.order || 1}</span>
                      {(lesson.exercises?.length || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold">
                          {lesson.exercises?.length} bài tập
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isTeacherOrAdmin && (
                        <button
                          type="button"
                          onClick={() => setAssignModalLesson(lesson)}
                          className="h-9.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Send className="size-3.5" />
                          <span>Giao cho lớp</span>
                        </button>
                      )}

                      <Link
                        href={`/grammar/${lesson.slug || lesson._id}`}
                        className="h-9.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-emerald-600 group-hover:text-white shadow-xs"
                      >
                        <span>{isTeacherOrAdmin ? "Xem & Quản lý" : "Vào học bài"}</span>
                        <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Thêm / Chỉnh sửa Bài Ngữ Pháp */}
        <GrammarEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          editingLesson={editingLesson}
          onSaved={(_saved, isEdit) => {
            notifySuccess(
              isEdit
                ? "Đã cập nhật bài học ngữ pháp!"
                : "Đã thêm bài học ngữ pháp mới thành công!"
            );
            fetchLessons();
            fetchMeta();
          }}
        />

        {/* Modal Giao bài cho lớp */}
        <AssignGrammarModal
          isOpen={Boolean(assignModalLesson)}
          onClose={() => setAssignModalLesson(null)}
          lesson={assignModalLesson}
          onAssigned={(msg) => {
            notifySuccess(msg);
            fetchMeta();
          }}
        />
      </main>
    </AppLayout>
  );
}
