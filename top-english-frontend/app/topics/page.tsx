/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh sách chủ đề học từ vựng (Topics Catalog) chuẩn UI/UX Pro Max
 * Tích hợp phân tầng hành động rõ ràng:
 * 1. Nút chính (Primary Button): "Flashcard" nổi bật màu xanh ngọc mint/teal
 * 2. Nút phụ (Secondary Action): Nút Outline "Soạn từ" cạnh nút chính dành riêng cho Giáo viên & Admin
 * 3. Trạng thái rỗng (Empty State) thông minh: Mờ đối với học sinh, nút Soạn từ ngay đối với giáo viên
 * 4. Thanh tiến độ học tập (Progress Indicator: Đã thuộc X/Y từ + thanh progress bar)
 * 5. Hiệu ứng tương tác nâng cao (Elevated hover translate-y, dynamic shadow, affordance, sound feedback)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
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
  { key: "ALL", label: "Tất cả", subLabel: "Mọi cấp độ", dotColor: "bg-slate-400" },
  { key: "A1", label: "A1", subLabel: "Cơ bản", dotColor: "bg-emerald-500" },
  { key: "A2", label: "A2", subLabel: "Sơ cấp", dotColor: "bg-sky-500" },
  { key: "B1", label: "B1", subLabel: "Trung cấp", dotColor: "bg-amber-500" },
  { key: "B2", label: "B2", subLabel: "Trung cao", dotColor: "bg-indigo-500" },
  { key: "C1", label: "C1", subLabel: "Cao cấp", dotColor: "bg-purple-500" },
  { key: "C2", label: "C2", subLabel: "Tinh thông", dotColor: "bg-rose-500" },
];

export default function TopicsPage() {
  const { user } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();
  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});

  // Bảng tiến độ học tập (Map topicId -> số từ đã thuộc)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // Thống kê tổng số lượng chủ đề cho mỗi cấp độ CEFR
  const fetchLevelSummary = useCallback(async () => {
    try {
      const res = await fetchApi<Topic[]>("/topics");
      if (res.success && Array.isArray(res.data)) {
        const counts: Record<string, number> = {
          ALL: res.data.length,
          A1: 0,
          A2: 0,
          B1: 0,
          B2: 0,
          C1: 0,
          C2: 0,
        };
        res.data.forEach((t) => {
          if (counts[t.level] !== undefined) {
            counts[t.level]++;
          }
        });
        setLevelCounts(counts);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchLevelSummary();
  }, [fetchLevelSummary]);

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

  // Đồng bộ tiến độ đã thuộc từ localStorage
  useEffect(() => {
    if (typeof window === "undefined" || topics.length === 0) return;

    const map: Record<string, number> = {};
    topics.forEach((t) => {
      try {
        const stored = localStorage.getItem(`topenglish_known_words_${t._id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            map[t._id] = parsed.length;
          }
        } else if (t.slug) {
          const storedSlug = localStorage.getItem(`topenglish_known_words_${t.slug}`);
          if (storedSlug) {
            const parsed = JSON.parse(storedSlug);
            if (Array.isArray(parsed)) {
              map[t._id] = parsed.length;
            }
          }
        }
      } catch {
        // Ignored
      }
    });
    setProgressMap(map);
  }, [topics]);

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
        fetchTopics();
        fetchLevelSummary();
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
                className="h-11 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="size-4 stroke-[3]" />
                Tạo chủ đề mới (Dành cho GV)
              </button>
            </div>
          )}
        </div>

        {/* Thông báo tạo thành công */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
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

        {/* FILTER & SEARCH CONTROL HUB (UI/UX PRO MAX) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs flex flex-col gap-4 transition-all">
          {/* TẦNG 1: THANH TÌM KIẾM CHỦ ĐỀ & BỘ ĐẾM KẾT QUẢ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
              <input
                id="search-topics"
                type="text"
                placeholder="Tra cứu theo tên chủ đề, từ vựng hoặc ngữ cảnh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10.5 pr-10 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              {/* Nút X xóa nhanh tìm kiếm */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                  title="Xóa từ khóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Thống kê kết quả & Nút đặt lại */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
                <Sparkles className="size-3.5 text-emerald-500" />
                <span>
                  {loading ? "Đang lọc..." : `Tìm thấy ${topics.length} chủ đề`}
                </span>
              </div>

              {(selectedLevel !== "ALL" || searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedLevel("ALL");
                    setSearchQuery("");
                  }}
                  className="h-9 px-3 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Đặt lại toàn bộ bộ lọc về mặc định"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* TẦNG 2: BỘ LỌC CẤP ĐỘ CEFR ĐỘC LẬP - TỰ ĐỘNG WRAP KHÔNG BAO GIỜ BỊ CHE */}
          <div className="flex flex-col gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <GraduationCap className="size-3.5 text-emerald-500" />
                <span>Cấp độ chuẩn CEFR:</span>
              </div>

              {selectedLevel !== "ALL" && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                  Đang lọc: {CEFR_LEVELS.find((l) => l.key === selectedLevel)?.label} ({CEFR_LEVELS.find((l) => l.key === selectedLevel)?.subLabel})
                </span>
              )}
            </div>

            {/* CEFR Level Chips - Hàng nút rộng rãi, tự động xuống dòng mượt mà khi màn hình hẹp */}
            <div className="flex flex-wrap items-center gap-2">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.key;
                const count = levelCounts[lvl.key];

                return (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedLevel(lvl.key);
                    }}
                    className={`h-9.5 px-3.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 select-none ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-slate-700/70"
                    }`}
                  >
                    {/* Level Color Dot Indicator */}
                    <span
                      className={`size-2 rounded-full shrink-0 transition-colors ${
                        isSelected ? "bg-white" : lvl.dotColor
                      }`}
                    />

                    <span>{lvl.label}</span>
                    {lvl.subLabel && (
                      <span
                        className={`text-[11px] font-medium hidden sm:inline ${
                          isSelected
                            ? "text-emerald-100"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        • {lvl.subLabel}
                      </span>
                    )}

                    {typeof count === "number" && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black transition-colors ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : count > 0
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-200/80 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {topics.map((topic) => {
              const isEmpty = topic.wordCount === 0;
              const learned = progressMap[topic._id] || 0;
              const percent = isEmpty
                ? 0
                : Math.min(100, Math.round((learned / topic.wordCount) * 100));

              return (
                <div
                  key={topic._id}
                  className={`group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 overflow-hidden shadow-xs hover:shadow-2xl hover:shadow-emerald-950/15 dark:hover:shadow-emerald-950/40 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 transition-all duration-300 ease-out hover:-translate-y-1.5 ${
                    isEmpty ? "opacity-95" : "cursor-pointer"
                  }`}
                >
                  {/* Topic Image Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {topic.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={topic.image}
                        alt={topic.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-500 text-white">
                        <BookOpen className="size-12 opacity-40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                    {/* Level Badge - Top Left */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border uppercase shadow-sm backdrop-blur-md ${getLevelBadge(
                          topic.level
                        )}`}
                      >
                        <GraduationCap className="size-3.5" /> CEFR {topic.level}
                      </span>
                    </div>

                    {/* Top Right Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {/* Word Count Badge */}
                      {isEmpty ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-300 border border-slate-600/50 backdrop-blur-md shadow-sm">
                          <Clock className="size-3 text-slate-400" /> 0 từ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/95 dark:bg-amber-600/95 text-white border border-amber-300/40 backdrop-blur-md shadow-sm">
                          <BookOpen className="size-3.5 text-amber-100" /> {topic.wordCount} từ
                        </span>
                      )}
                    </div>

                    {/* Topic Title on Banner */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h2 className="text-lg sm:text-xl font-black text-white drop-shadow-md leading-snug">
                        {topic.title}
                      </h2>
                    </div>
                  </div>

                  {/* Topic Body */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-5">
                    {/* Description */}
                    <p className="text-[13px] sm:text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {topic.description ||
                        "Hành trang từ vựng thiết yếu và ngữ cảnh ứng dụng thực tế cho chủ đề này."}
                    </p>

                    {/* Thanh tiến độ học tập (Progress Indicator) */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {!isEmpty ? (
                        <>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              {percent === 100 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Trophy className="size-3.5 text-amber-500" />
                                  Đã thành thạo {learned}/{topic.wordCount} từ
                                </span>
                              ) : learned > 0 ? (
                                <span className="text-slate-700 dark:text-slate-300">
                                  Đã thuộc {learned}/{topic.wordCount} từ
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Chưa bắt đầu học (0/{topic.wordCount})
                                </span>
                              )}
                            </span>
                            <span
                              className={`text-[11px] font-black ${
                                percent === 100
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : percent > 0
                                  ? "text-teal-600 dark:text-teal-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>

                          {/* Progress Line */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                percent === 100
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-xs shadow-emerald-500/50"
                                  : percent > 0
                                  ? "bg-emerald-500"
                                  : "bg-transparent"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        /* Empty Progress State */
                        <div className="flex items-center justify-between text-xs text-slate-400 py-0.5">
                          <span className="flex items-center gap-1.5 text-[11px] italic">
                            <Clock className="size-3.5 text-amber-500" />
                            Đang chuẩn bị học liệu từ vựng
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            0%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS: TÁCH BẠCH RÕ RÀNG NÚT CHÍNH (PRIMARY) VÀ NÚT PHỤ (SECONDARY) */}
                    {isEmpty ? (
                      isTeacherOrAdmin ? (
                        /* Case A: Chủ đề 0 từ (Giáo viên / Admin) -> Cụm 2 nút: Soạn bài ngay + Xem trước rỗng */
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/topics/${topic.slug || topic._id}?mode=list&action=add`}
                            onClick={() => playClickSound()}
                            className="flex-1 h-11 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-between shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer group/btn"
                            title="Chủ đề đang trống, bấm để bắt đầu soạn từ vựng ngay"
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus className="size-4 stroke-[3]" />
                              Soạn từ vựng ngay
                            </span>
                            <ChevronRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>

                          <Link
                            href={`/topics/${topic.slug || topic._id}`}
                            onClick={() => playClickSound()}
                            className="h-11 px-3.5 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                            title="Xem trước (Preview) giao diện rỗng dưới góc nhìn học viên"
                          >
                            <Eye className="size-4" />
                            <span className="hidden sm:inline">Xem trước</span>
                          </Link>
                        </div>
                      ) : (
                        /* Case B: Chủ đề 0 từ (Học viên) -> Nút Mờ Disabled "Đang cập nhật / Sắp ra mắt" */
                        <div
                          className="h-11 px-4 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700/80 flex items-center justify-between cursor-not-allowed select-none opacity-80"
                          title="Chủ đề này chưa có từ vựng. Đang cập nhật nội dung học tập!"
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="size-3.5 text-slate-400" />
                            Đang cập nhật từ vựng
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            Sắp ra mắt
                          </span>
                        </div>
                      )
                    ) : isTeacherOrAdmin ? (
                      /* Case C-1: Chủ đề có từ vựng (Giáo viên & Admin) -> Nút chính Flashcard (xanh mint nổi bật) + Nút phụ Outline Soạn từ */
                      <div className="flex items-center gap-2">
                        {/* Nút chính (Primary Action): Trải nghiệm và xem trước Flashcard */}
                        <Link
                          href={`/topics/${topic.slug || topic._id}`}
                          onClick={() => playClickSound()}
                          className="flex-1 h-11 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white flex items-center justify-between border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-600 transition-all duration-200 shadow-xs cursor-pointer group/btn"
                          title="Trải nghiệm và xem trước (Preview) Flashcard dưới góc nhìn học viên"
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="size-4" />
                            <span>Flashcard</span>
                          </span>
                          <ChevronRight className="size-4 group-hover/btn:translate-x-1.5 transition-transform" />
                        </Link>

                        {/* Nút phụ (Secondary Action): Dạng Outline chìm hơn, nền trong suốt để tránh tranh chấp thị giác */}
                        <Link
                          href={`/topics/${topic.slug || topic._id}?mode=list`}
                          onClick={() => playClickSound()}
                          className="h-11 px-3 sm:px-3.5 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                          title="Quản lý dữ liệu & Soạn bài (Thêm, Sửa, Xóa từ vựng)"
                        >
                          <Edit3 className="size-3.5" />
                          <span className="hidden sm:inline">Soạn từ</span>
                        </Link>
                      </div>
                    ) : (
                      /* Case C-2: Chủ đề có từ vựng (Học viên) -> Nút chính Flashcard trải dài toàn bộ */
                      <Link
                        href={`/topics/${topic.slug || topic._id}`}
                        onClick={() => playClickSound()}
                        className="h-11 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white flex items-center justify-between border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-600 transition-all duration-200 shadow-xs cursor-pointer group/btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="size-4" />
                          <span>Flashcard</span>
                        </span>
                        <ChevronRight className="size-4 group-hover/btn:translate-x-1.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
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
                    placeholder="Ví dụ: Daily Life & Routine, Travel, Job & Careers, Games..."
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
