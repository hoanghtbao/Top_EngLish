/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang danh sách chủ đề học từ vựng (Topics Catalog) phân cấp theo CEFR (A1 - C2)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Filter,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { fetchApi } from "../../lib/api-client";

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
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

    const timer = setTimeout(() => {
      fetchTopics();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedLevel, searchQuery]);

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
            Module 5: Thư viện từ vựng chuẩn CEFR
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Chủ đề học từ vựng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            Lựa chọn chủ đề phù hợp với trình độ của bạn để bắt đầu học với thẻ Flashcard 3D, phiên âm IPA quốc tế và ví dụ ngữ cảnh sinh động.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* CEFR Level Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
              <Filter className="size-3.5" /> Cấp độ:
            </span>
            {CEFR_LEVELS.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setSelectedLevel(lvl.key)}
                className={`h-11 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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
              className="w-full h-11 pl-10 pr-4 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100"
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

                  {/* Word Count Badge - Distinct Warm Amber / Orange Theme */}
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
                  {/* High Contrast & Spacious Typography */}
                  <p className="text-[13px] sm:text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {topic.description || "Hành trang từ vựng thiết yếu và ngữ cảnh ứng dụng thực tế cho chủ đề này."}
                  </p>

                  {/* Action Link with High Affordance */}
                  <Link
                    href={`/topics/${topic.slug || topic._id}`}
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
      </main>
    </AppLayout>
  );
}
