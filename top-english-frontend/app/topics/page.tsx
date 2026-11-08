/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh sách chủ đề học từ vựng (Topics Catalog) phân cấp theo CEFR (A1 - C2)
 * Tích hợp quyền tạo chủ đề bài giảng dành cho Giáo viên (Teacher) và Quản trị viên (Admin)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { fetchApi } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import { useSound } from "../../context/sound-context";

interface Topic {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  wordCount: number;
}

const CEFR_LEVELS = [
  { key: "ALL", label: "Tất cả cấp độ" },
  { key: "A1", label: "A1 - Cơ bản" },
  { key: "A2", label: "A2 - Sơ cấp" },
  { key: "B1", label: "B1 - Trung cấp" },
  { key: "B2", label: "B2 - Trung cao" },
  { key: "C1", label: "C1 - Cao cấp" },
  { key: "C2", label: "C2 - Tinh thông" },
];

export default function TopicsPage() {
  const { user } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();
  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- MODAL TẠO CHỦ ĐỀ DÀNH CHO GIÁO VIÊN & ADMIN ---
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState({
    title: "",
    level: "A2" as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    description: "",
    image: "",
  });

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedLevel !== "ALL") {
        queryParams.append("level", selectedLevel);
      }
      if (searchQuery.trim()) {
        queryParams.append("search", searchQuery.trim());
      }

      const res = await fetchApi<Topic[]>(`/topics?${queryParams.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setTopics(res.data);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách chủ đề:", err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTopics();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedLevel, searchQuery]);

  // Xử lý tạo chủ đề mới
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title.trim()) {
      setErrorMessage("Vui lòng nhập tên chủ đề!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload: {
        title: string;
        level: string;
        description?: string;
        image?: string;
      } = {
        title: newTopic.title.trim(),
        level: newTopic.level,
      };

      if (newTopic.description.trim()) {
        payload.description = newTopic.description.trim();
      }
      if (newTopic.image.trim()) {
        payload.image = newTopic.image.trim();
      }

      const res = await fetchApi<Topic>("/topics", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setSuccessMessage(`Đã tạo thành công chủ đề "${res.data.title}"!`);
        setShowCreateModal(false);
        setNewTopic({
          title: "",
          level: "A2",
          description: "",
          image: "",
        });
        // Tải lại danh sách
        fetchTopics();
      } else {
        setErrorMessage(res.message || "Không thể tạo chủ đề. Vui lòng thử lại!");
      }
    } catch (err: any) {
      console.error("Lỗi tạo chủ đề:", err);
      setErrorMessage(err.message || "Tạo chủ đề thất bại. Vui lòng kiểm tra quyền Giáo viên!");
    } finally {
      setIsSubmitting(false);
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit">
              <Sparkles className="size-3.5" />
              Thư viện từ vựng chuẩn CEFR
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Chủ Đề Học Từ Vựng
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Lựa chọn chủ đề phù hợp với trình độ của bạn để bắt đầu học với thẻ Flashcard 3D, phiên âm IPA quốc tế và ví dụ ngữ cảnh sinh động.
            </p>
          </div>

          {/* Teacher / Admin Action Button */}
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setErrorMessage(null);
                  setShowCreateModal(true);
                }}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="size-4 stroke-[3]" />
                Tạo chủ đề mới (Dành cho GV)
              </button>
            </div>
          )}
        </div>

        {/* Thông báo tạo thành công */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* CEFR Level Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
              <Filter className="size-3.5" /> Cấp độ:
            </span>
            {CEFR_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => {
                  playClickSound();
                  setSelectedLevel(lvl.key);
                }}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedLevel === lvl.key
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
              id="search-topics"
              type="text"
              placeholder="Tìm kiếm chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Layers className="size-7" />
            </div>
            <h3 className="text-lg font-bold">Không tìm thấy chủ đề phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Không có chủ đề nào phù hợp với bộ lọc hoặc từ khóa &quot;{searchQuery}&quot;. Hãy thử xóa bộ lọc để xem tất cả.
            </p>
            <button
              onClick={() => {
                playClickSound();
                setSelectedLevel("ALL");
                setSearchQuery("");
              }}
              className="mt-2 h-11 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
            >
              Xem tất cả chủ đề
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <div
                key={topic._id}
                className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300"
              >
                {/* Topic Image Header */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {topic.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topic.image}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-500 text-white">
                      <BookOpen className="size-12 opacity-40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Level Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border uppercase shadow-sm backdrop-blur-md ${getLevelBadge(
                        topic.level
                      )}`}
                    >
                      <GraduationCap className="size-3.5" /> CEFR {topic.level}
                    </span>
                  </div>

                  {/* Word Count Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/95 dark:bg-amber-600/95 text-white border border-amber-300/40 backdrop-blur-md shadow-sm">
                      <BookOpen className="size-3.5 text-amber-100" /> {topic.wordCount} từ
                    </span>
                  </div>

                  {/* Topic Title on Banner */}
                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow-md leading-snug">
                      {topic.title}
                    </h2>
                  </div>
                </div>

                {/* Topic Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                  <p className="text-[13px] sm:text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {topic.description || "Hành trang từ vựng thiết yếu và ngữ cảnh ứng dụng thực tế cho chủ đề này."}
                  </p>

                  <Link
                    href={`/topics/${topic.slug || topic._id}`}
                    onClick={() => playClickSound()}
                    className="h-11 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white flex items-center justify-between border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-600 transition-all duration-200 shadow-xs cursor-pointer group/btn"
                  >
                    <span>Luyện tập Flashcard</span>
                    <ChevronRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: TẠO CHỦ ĐỀ MỚI DÀNH CHO GIÁO VIÊN & ADMIN */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Tạo Chủ Đề Từ Vựng Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Soạn bài giảng và bộ thẻ Flashcard dành cho học sinh
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Error message in modal */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreateTopic} className="flex flex-col gap-4">
                {/* Tiêu đề */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên chủ đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Daily Life & Routine, Travel, Job & Careers..."
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Cấp độ CEFR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Trình độ chuẩn CEFR <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTopic.level}
                    onChange={(e) =>
                      setNewTopic({
                        ...newTopic,
                        level: e.target.value as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
                      })
                    }
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="A1">A1 - Cơ bản (Mới bắt đầu)</option>
                    <option value="A2">A2 - Sơ cấp (Giao tiếp đơn giản)</option>
                    <option value="B1">B1 - Trung cấp (Tự tin học tập & làm việc)</option>
                    <option value="B2">B2 - Trung cao (Lưu loát, tự nhiên)</option>
                    <option value="C1">C1 - Cao cấp (Học thuật, chuyên môn)</option>
                    <option value="C2">C2 - Tinh thông (Như người bản xứ)</option>
                  </select>
                </div>

                {/* Mô tả ngắn */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mô tả chủ đề
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tóm tắt ngắn gọn nội dung và mục tiêu từ vựng của chủ đề này..."
                    value={newTopic.description}
                    onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* URL Ảnh bìa (tùy chọn) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL Ảnh bìa minh họa (Tùy chọn)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newTopic.image}
                    onChange={(e) => setNewTopic({ ...newTopic, image: e.target.value })}
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/30 cursor-pointer"
                  >
                    {isSubmitting ? "Đang tạo chủ đề..." : "Tạo Chủ Đề Ngay"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
