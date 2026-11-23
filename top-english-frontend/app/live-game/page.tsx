/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Sảnh chờ Đấu trường Leo Núi Thời Gian Thực (Mountain Climbing Arena Lobby Hub) tuân thủ AppLayout và UI/UX Pro Max
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Layers,
  Lock,
  Mountain,
  PlusCircle,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import PageHeaderBanner from "../../components/PageHeaderBanner";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface Character {
  id: string;
  name: string;
  icon: string;
  color: string;
  avatarBg: string;
}

interface QuizSourceItem {
  _id: string;
  title: string;
  level: string;
  type: string;
  totalQuestions: number;
  mcqCount: number;
  durationMinutes: number;
}

interface TopicSourceItem {
  _id: string;
  title: string;
  slug: string;
  lessonNumber: number;
  level: string;
  wordCount: number;
}

interface VocabClassSourceItem {
  _id: string;
  name: string;
  code: string;
  totalWords: number;
  topics: TopicSourceItem[];
}

interface GrammarSourceItem {
  _id: string;
  title: string;
  slug: string;
  level: string;
  category: string;
  exerciseCount: number;
  mcqCount: number;
}

interface CreatorSourcesResponse {
  quizzes: QuizSourceItem[];
  vocabClasses: VocabClassSourceItem[];
  ungroupedTopics: TopicSourceItem[];
  grammarLessons: GrammarSourceItem[];
}

const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "bear",
    name: "Gấu Dũng Mãnh",
    icon: "🐻",
    color: "from-amber-600 to-amber-800",
    avatarBg: "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  },
  {
    id: "fox",
    name: "Cáo Nhanh Nhẹn",
    icon: "🦊",
    color: "from-orange-500 to-red-600",
    avatarBg: "bg-orange-100 dark:bg-orange-950/70 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-800",
  },
  {
    id: "eagle",
    name: "Đại Bàng Bầu Trời",
    icon: "🦅",
    color: "from-blue-600 to-indigo-700",
    avatarBg: "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  },
  {
    id: "lion",
    name: "Sư Tử Tiên Phong",
    icon: "🦁",
    color: "from-yellow-500 to-amber-600",
    avatarBg: "bg-yellow-100 dark:bg-yellow-950/70 text-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800",
  },
  {
    id: "panda",
    name: "Panda Kiên Trì",
    icon: "🐼",
    color: "from-emerald-600 to-teal-700",
    avatarBg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
  },
  {
    id: "wolf",
    name: "Sói Tuyết Băng Giá",
    icon: "🐺",
    color: "from-cyan-600 to-blue-700",
    avatarBg: "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800",
  },
  {
    id: "astronaut",
    name: "Phi Hành Gia",
    icon: "🚀",
    color: "from-purple-600 to-pink-600",
    avatarBg: "bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800",
  },
  {
    id: "robot",
    name: "Robot Siêu Cấp",
    icon: "🤖",
    color: "from-slate-600 to-slate-800",
    avatarBg: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-400 dark:border-slate-700",
  },
];

export default function LiveGameLobbyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const isHostAuthorized = Boolean(
    isAuthenticated && (user?.role === "teacher" || user?.role === "admin")
  );

  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState<string>("bear");

  // Player Join State
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [joinError, setJoinError] = useState("");

  // Host Create State (Teacher / Admin only)
  const [roomTitle, setRoomTitle] = useState("");
  const [sourceMode, setSourceMode] = useState<"quiz" | "custom">("quiz");
  const [sources, setSources] = useState<CreatorSourcesResponse>({
    quizzes: [],
    vocabClasses: [],
    ungroupedTopics: [],
    grammarLessons: [],
  });
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [activeClassId, setActiveClassId] = useState<string>("all");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedGrammarIds, setSelectedGrammarIds] = useState<string[]>([]);
  const [grammarSearch, setGrammarSearch] = useState("");
  const [vocabQuestionMode, setVocabQuestionMode] = useState<
    "mixed_abcd" | "en_to_vi" | "vi_to_en"
  >("mixed_abcd");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(15);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Đảm bảo học viên/khách không ở lại tab Tạo phòng
  useEffect(() => {
    if (!isHostAuthorized && activeTab === "create") {
      setActiveTab("join");
    }
  }, [isHostAuthorized, activeTab]);

  // Nạp danh sách nhân vật từ backend
  useEffect(() => {
    async function loadCharacters() {
      try {
        const res = await fetchApi<Character[]>("/live-game/characters");
        if (res.success && res.data && res.data.length > 0) {
          setCharacters(res.data);
        }
      } catch {
        // Giữ default nếu lỗi
      }
    }
    loadCharacters();
  }, []);

  // Nạp nguồn bộ câu hỏi Đấu trường cho Giáo viên / Admin
  useEffect(() => {
    if (!isHostAuthorized) return;
    async function loadCreatorSources() {
      setIsLoadingSources(true);
      try {
        const res = await fetchApi<CreatorSourcesResponse>("/live-game/sources");
        if (res.success && res.data) {
          setSources(res.data);
          if (res.data.vocabClasses.length > 0) {
            setActiveClassId(res.data.vocabClasses[0]._id);
          }
        }
      } catch {
        // Bỏ qua lỗi im lặng nếu chưa đủ quyền
      } finally {
        setIsLoadingSources(false);
      }
    }
    loadCreatorSources();
  }, [isHostAuthorized]);

  // Tự động điền biệt danh nếu đã đăng nhập
  useEffect(() => {
    if (user?.fullName && !nickname) {
      setNickname(user.fullName);
    }
  }, [user, nickname]);

  // Xử lý tham gia trận đấu
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");

    const cleanPin = pin.trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      setJoinError("Vui lòng nhập đúng mã PIN gồm 6 chữ số.");
      return;
    }

    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setJoinError("Vui lòng nhập biệt danh của bạn để thi đấu.");
      return;
    }

    router.push(
      `/live-game/${cleanPin}?nickname=${encodeURIComponent(
        cleanNick,
      )}&character=${encodeURIComponent(selectedCharId)}`,
    );
  };

  const toggleTopicId = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGrammarId = (id: string) => {
    setSelectedGrammarIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllTopicsInClass = (topics: TopicSourceItem[]) => {
    const validIds = topics.filter((t) => t.wordCount > 0).map((t) => t._id);
    if (validIds.length === 0) return;
    const allSelected = validIds.every((id) => selectedTopicIds.includes(id));
    if (allSelected) {
      setSelectedTopicIds((prev) => prev.filter((id) => !validIds.includes(id)));
    } else {
      setSelectedTopicIds((prev) => Array.from(new Set([...prev, ...validIds])));
    }
  };

  // Xử lý Host tạo phòng đấu mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHostAuthorized) return;
    setCreateError("");

    if (
      sourceMode === "custom" &&
      selectedTopicIds.length === 0 &&
      selectedGrammarIds.length === 0
    ) {
      setCreateError(
        "Vui lòng tích chọn ít nhất 1 bài Ngữ pháp hoặc 1 Lesson Từ vựng để tạo bộ câu hỏi."
      );
      return;
    }

    setIsCreating(true);
    const chosenQuiz = sources.quizzes.find((q) => q._id === selectedQuizId);
    const autoTitle =
      sourceMode === "quiz"
        ? chosenQuiz
          ? `Đấu Trường: ${chosenQuiz.title}`
          : "Trận Đua Leo Núi Tiếng Anh"
        : `Đấu Trường Tổng Hợp (${questionCount} câu)`;

    try {
      const res = await fetchApi<{ pin: string; title: string }>("/live-game/rooms", {
        method: "POST",
        body: JSON.stringify({
          title: roomTitle.trim() || autoTitle,
          sourceMode,
          quizId: sourceMode === "quiz" ? selectedQuizId || undefined : undefined,
          topicIds: sourceMode === "custom" ? selectedTopicIds : undefined,
          grammarLessonIds: sourceMode === "custom" ? selectedGrammarIds : undefined,
          vocabQuestionMode: sourceMode === "custom" ? vocabQuestionMode : undefined,
          questionCount: sourceMode === "custom" ? questionCount : undefined,
          timePerQuestion,
          shuffleQuestions,
          shuffleOptions,
        }),
      });

      if (res.success && res.data?.pin) {
        const defaultHostName = user?.fullName || "Chủ Phòng";
        router.push(
          `/live-game/${res.data.pin}?host=true&nickname=${encodeURIComponent(
            defaultHostName,
          )}&character=${encodeURIComponent(selectedCharId)}`,
        );
      } else {
        setCreateError(res.message || "Không thể tạo phòng lúc này");
      }
    } catch (err: any) {
      setCreateError(err.message || "Lỗi kết nối khi khởi tạo phòng đấu");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* CENTERED HERO BANNER - THEME NGỌC BÍCH EMERALD-TEAL */}
        <PageHeaderBanner
          pageKey="live_game"
          badgeIcon={<Radio className="size-3.5 animate-pulse" />}
          badgeText="Live Arena Realtime"
          title="Đấu Trường Leo Núi Thời Gian Thực"
          description="Nhập mã phòng, hóa thân thành 8 linh vật leo núi dũng cảm. Mỗi câu trả lời tiếng Anh chính xác giúp bạn nhích lên sườn dốc ngay tức khắc trước mắt đối thủ!"
          stats={[
            {
              icon: <Trophy className="size-4" />,
              label: "Bục vinh quang",
              value: "Top 3 Chạm Đỉnh",
            },
            {
              icon: <Flame className="size-4" />,
              label: "Điểm số bứt phá",
              value: "Combo & Tốc độ",
            },
          ]}
        />

        {/* MAIN INTERACTIVE CARD: TABS FOR JOIN VS HOST */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Tab Selection Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-3.5 sm:py-4 px-3 sm:px-6 text-xs sm:text-base font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer min-h-[44px] ${
                activeTab === "join"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Swords className="size-4 sm:size-5 shrink-0" />
              <span className="hidden sm:inline">1. Tham Gia Trận Đấu (Học Viên)</span>
              <span className="sm:hidden">1. Vào Phòng Đấu</span>
            </button>
            {isHostAuthorized ? (
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-3.5 sm:py-4 px-3 sm:px-6 text-xs sm:text-base font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer min-h-[44px] ${
                  activeTab === "create"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <PlusCircle className="size-4 sm:size-5 shrink-0" />
                <span className="hidden sm:inline">2. Tạo Phòng Đấu Mới (Giáo Viên / Admin)</span>
                <span className="sm:hidden">2. Tạo Phòng Mới</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-5 text-xs text-slate-400 font-medium">
                <Lock className="size-3.5" />
                Chỉ Giáo viên &amp; Admin có quyền tạo phòng đấu
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* TAB 1: JOIN GAME */}
            {activeTab === "join" && (
              <form onSubmit={handleJoinGame} className="flex flex-col gap-8">
                {joinError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
                    <span className="font-bold">⚠️ Lỗi:</span> {joinError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: PIN and Nickname */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Mã PIN Phòng Đấu (6 chữ số)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ví dụ: 987456"
                        className="w-full h-14 px-4 text-center tracking-[0.3em] font-mono text-2xl sm:text-3xl font-black rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Nhập 6 số được chia sẻ từ Giáo viên hoặc Bạn bè để vào phòng.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Biệt Danh Của Bạn (Tên hiển thị khi leo núi)
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Ví dụ: Hoàng Bảo, Alex Pro, ChiChi..."
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Character Selection Summary */}
                  <div className="flex flex-col justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-500" />
                      Linh vật leo núi đang chọn
                    </div>
                    {characters.find((c) => c.id === selectedCharId) && (
                      <div className="flex items-center gap-4">
                        <div
                          className={`size-20 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 ${
                            characters.find((c) => c.id === selectedCharId)?.avatarBg
                          }`}
                        >
                          {characters.find((c) => c.id === selectedCharId)?.icon}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {characters.find((c) => c.id === selectedCharId)?.name}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Sẵn sàng chinh phục đỉnh núi 🚩
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Chọn nhân vật khác ở danh sách bên dưới nếu muốn thay đổi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 8 Character Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Users className="size-4 text-slate-400" />
                      Chọn 1 trong 8 linh vật leo núi
                    </label>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã chọn: {characters.find((c) => c.id === selectedCharId)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {characters.map((char) => {
                      const isSelected = selectedCharId === char.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => setSelectedCharId(char.id)}
                          className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="size-3 stroke-[3]" />
                            </div>
                          )}
                          <div
                            className={`size-14 rounded-xl flex items-center justify-center text-3xl shadow-sm border ${char.avatarBg}`}
                          >
                            {char.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {char.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <Mountain className="size-6" />
                    Vào Phòng Thi Đấu Leo Núi
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ROOM (TEACHER / ADMIN ONLY) */}
            {activeTab === "create" && isHostAuthorized && (
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-6">
                {createError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
                    ⚠️ {createError}
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {/* SOURCE MODE SWITCHER */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Nguồn Bộ Câu Hỏi Đấu Trường
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSourceMode("quiz")}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-3 ${
                          sourceMode === "quiz"
                            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <BookOpen className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Chế độ A: Bộ đề Quiz có sẵn
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Chọn đề chính thức trong kho /quizzes (tự lọc câu MCQ)
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSourceMode("custom")}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-start gap-3 ${
                          sourceMode === "custom"
                            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="size-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                          <Layers className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Chế độ B: Trộn Ngữ pháp &amp; Từ vựng
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Tích bài Ngữ pháp (MCQ) + Lớp/Lesson Từ vựng (không rác DB)
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* MODE A: OFFICIAL QUIZ DROPDOWN */}
                  {sourceMode === "quiz" && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <BookOpen className="size-3.5 text-emerald-500" />
                          Chọn Bộ Đề Quiz Chính Thức
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {isLoadingSources
                            ? "Đang tải..."
                            : `${sources.quizzes.filter((q) => q.mcqCount > 0).length} bộ đề khả dụng`}
                        </span>
                      </div>

                      <select
                        value={selectedQuizId}
                        onChange={(e) => setSelectedQuizId(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium outline-none cursor-pointer"
                      >
                        <option value="">
                          Bộ câu hỏi mẫu TopEnglish — 6 câu trắc nghiệm mặc định
                        </option>
                        {sources.quizzes.map((quiz) => (
                          <option
                            key={quiz._id}
                            value={quiz._id}
                            disabled={quiz.mcqCount === 0}
                          >
                            [{quiz.level}] {quiz.title} —{" "}
                            {quiz.mcqCount > 0
                              ? `${quiz.mcqCount} câu trắc nghiệm`
                              : "Chưa có câu trắc nghiệm (0 câu)"}
                          </option>
                        ))}
                      </select>

                      {(() => {
                        const chosenQuiz = sources.quizzes.find(
                          (q) => q._id === selectedQuizId
                        );
                        return (
                          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            {chosenQuiz ? (
                              <span>
                                Sẽ thi <strong>{chosenQuiz.mcqCount} câu trắc nghiệm</strong>{" "}
                                từ đề &ldquo;{chosenQuiz.title}&rdquo;
                                {chosenQuiz.totalQuestions > chosenQuiz.mcqCount
                                  ? ` (đã tự bỏ ${
                                      chosenQuiz.totalQuestions - chosenQuiz.mcqCount
                                    } câu điền từ)`
                                  : ""}
                                .
                              </span>
                            ) : (
                              <span>
                                Đang dùng 6 câu mẫu TopEnglish. Hãy chọn đề ở trên để thi theo
                                kho /quizzes.
                              </span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* MODE B: CUSTOM GRAMMAR (PUBLISHED MCQ) + VOCAB BY CLASS/LESSON */}
                  {sourceMode === "custom" && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col gap-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* LEFT: GRAMMAR PUBLISHED LESSONS */}
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <GraduationCap className="size-4 text-emerald-600" />
                              Bài Ngữ Pháp (Đã xuất bản)
                            </label>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Đã chọn: {selectedGrammarIds.length} bài
                            </span>
                          </div>

                          <div className="relative">
                            <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={grammarSearch}
                              onChange={(e) => setGrammarSearch(e.target.value)}
                              placeholder="Tìm bài ngữ pháp..."
                              className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                            {sources.grammarLessons
                              .filter((g) =>
                                g.title
                                  .toLowerCase()
                                  .includes(grammarSearch.trim().toLowerCase())
                              )
                              .map((lesson) => {
                                const checked = selectedGrammarIds.includes(lesson._id);
                                const hasMcq = lesson.mcqCount > 0;
                                return (
                                  <label
                                    key={lesson._id}
                                    className={`p-2.5 flex items-center justify-between gap-2 text-xs transition ${
                                      hasMcq
                                        ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        : "opacity-50 cursor-not-allowed"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!hasMcq}
                                        onChange={() => toggleGrammarId(lesson._id)}
                                        className="size-4 rounded accent-emerald-600 shrink-0"
                                      />
                                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                        [{lesson.level}] {lesson.title}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                        hasMcq
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                          : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                      }`}
                                    >
                                      {lesson.mcqCount} MCQ
                                    </span>
                                  </label>
                                );
                              })}
                            {sources.grammarLessons.length === 0 && (
                              <div className="p-4 text-center text-xs text-slate-400">
                                {isLoadingSources
                                  ? "Đang tải bài ngữ pháp..."
                                  : "Chưa có bài ngữ pháp đã xuất bản."}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: VOCABULARY BY CLASS & LESSON */}
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <FolderOpen className="size-4 text-indigo-600" />
                              Từ Vựng Theo Lớp / Lesson
                            </label>
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              Đã chọn: {selectedTopicIds.length} bài
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={activeClassId}
                              onChange={(e) => setActiveClassId(e.target.value)}
                              className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              {sources.vocabClasses.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                  {cls.name} ({cls.topics.length} bài · {cls.totalWords} từ)
                                </option>
                              ))}
                              {sources.ungroupedTopics.length > 0 && (
                                <option value="ungrouped">
                                  Chủ đề tự do ({sources.ungroupedTopics.length} bài)
                                </option>
                              )}
                              <option value="all">Tất cả các Lớp &amp; Bài</option>
                            </select>

                            {(() => {
                              const currentClassTopics =
                                activeClassId === "all"
                                  ? [
                                      ...sources.vocabClasses.flatMap((c) => c.topics),
                                      ...sources.ungroupedTopics,
                                    ]
                                  : activeClassId === "ungrouped"
                                  ? sources.ungroupedTopics
                                  : sources.vocabClasses.find((c) => c._id === activeClassId)
                                      ?.topics || [];
                              return (
                                <button
                                  type="button"
                                  onClick={() => toggleAllTopicsInClass(currentClassTopics)}
                                  className="h-9 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition cursor-pointer shrink-0"
                                >
                                  Chọn/Bỏ lớp
                                </button>
                              );
                            })()}
                          </div>

                          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                            {(() => {
                              const displayTopics =
                                activeClassId === "all"
                                  ? [
                                      ...sources.vocabClasses.flatMap((c) => c.topics),
                                      ...sources.ungroupedTopics,
                                    ]
                                  : activeClassId === "ungrouped"
                                  ? sources.ungroupedTopics
                                  : sources.vocabClasses.find((c) => c._id === activeClassId)
                                      ?.topics || [];

                              if (displayTopics.length === 0) {
                                return (
                                  <div className="p-4 text-center text-xs text-slate-400">
                                    {isLoadingSources
                                      ? "Đang tải bài học từ vựng..."
                                      : "Lớp này chưa có bài học từ vựng nào."}
                                  </div>
                                );
                              }

                              return displayTopics.map((topic) => {
                                const checked = selectedTopicIds.includes(topic._id);
                                const hasWords = topic.wordCount > 0;
                                return (
                                  <label
                                    key={topic._id}
                                    className={`p-2.5 flex items-center justify-between gap-2 text-xs transition ${
                                      hasWords
                                        ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        : "opacity-50 cursor-not-allowed"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!hasWords}
                                        onChange={() => toggleTopicId(topic._id)}
                                        className="size-4 rounded accent-indigo-600 shrink-0"
                                      />
                                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {topic.title} ({topic.level})
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                                      {topic.wordCount} từ
                                    </span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* QUESTION COUNT & VOCAB QUESTION DIRECTION */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Số Câu Hỏi Trận Đấu
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setQuestionCount(cnt)}
                                className={`h-10 rounded-xl border-2 text-xs font-bold transition cursor-pointer ${
                                  questionCount === cnt
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                                }`}
                              >
                                {cnt} câu
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Kiểu Câu Hỏi Từ Vựng
                          </label>
                          <select
                            value={vocabQuestionMode}
                            onChange={(e) =>
                              setVocabQuestionMode(
                                e.target.value as "mixed_abcd" | "en_to_vi" | "vi_to_en"
                              )
                            }
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="mixed_abcd">
                              Trộn cả 2 chiều (Anh → Việt &amp; Việt → Anh)
                            </option>
                            <option value="en_to_vi">Chỉ Anh → Nghĩa Tiếng Việt</option>
                            <option value="vi_to_en">Chỉ Tiếng Việt → Từ Tiếng Anh</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-emerald-500 shrink-0" />
                        Bộ câu hỏi sinh trực tiếp vào phòng chơi trong RAM (không lưu đề rác
                        vào kho /quizzes).
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Tiêu Đề Trận Đấu (Tên Phòng)
                    </label>
                    <input
                      type="text"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      placeholder="Ví dụ: Đại Chiến Leo Núi Từ Vựng B1 - Lớp 11A1"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Thời Gian Cho Mỗi Câu Hỏi
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { time: 10, label: "10 Giây", desc: "Tốc độ chớp nhoáng" },
                        { time: 15, label: "15 Giây", desc: "Tiêu chuẩn cân bằng" },
                        { time: 20, label: "20 Giây", desc: "Thong thả suy nghĩ" },
                        { time: 30, label: "30 Giây", desc: "Câu hỏi nâng cao" },
                      ].map((item) => (
                        <button
                          key={item.time}
                          type="button"
                          onClick={() => setTimePerQuestion(item.time)}
                          className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                            timePerQuestion === item.time
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <Clock className="size-5 mb-1 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold">{item.label}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shuffle Options */}
                  <div className="flex flex-wrap items-center gap-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="size-4 rounded accent-emerald-600 cursor-pointer"
                      />
                      <Shuffle className="size-3.5 text-emerald-600" />
                      Tự động xáo thứ tự câu hỏi
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                        className="size-4 rounded accent-emerald-600 cursor-pointer"
                      />
                      Tự động xáo vị trí đáp án A/B/C/D
                    </label>
                  </div>

                  {/* Host Character Choice */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Linh vật của Host
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {characters.map((char) => (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => setSelectedCharId(char.id)}
                          className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
                            selectedCharId === char.id
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <span className="text-2xl">{char.icon}</span>
                          <span className="text-[10px] font-medium truncate w-full text-center">
                            {char.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <PlusCircle className="size-6" />
                    {isCreating ? "Đang tạo phòng đấu..." : "Khởi Tạo Đấu Trường & Lấy Mã PIN"}
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* GAMEPLAY RULES & INSTRUCTIONS CARDS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Luật Thi Đấu & Cơ Chế Leo Núi Realtime
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chọn Nhân Vật & Vào Phòng
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập 6 chữ số mã PIN từ giáo viên hoặc bạn bè, chọn 1 trong 8 nhân vật đặc biệt để đại diện cho bạn trên sườn núi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Leo Núi Realtime Tức Thì
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mỗi khi chọn đúng đáp án trắc nghiệm, nhân vật của bạn sẽ ngay lập tức leo nhích lên sườn núi trên màn hình của tất cả mọi người!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tốc Độ & Chuỗi Thắng (Streak)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trả lời càng nhanh càng nhận được nhiều điểm thưởng (tối đa 1,000 điểm). Duy trì chuỗi đúng liên tiếp để bứt phá dẫn đầu!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-base">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bục Vinh Quang Top 3
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                3 nhà leo núi chạm đỉnh đầu tiên hoặc đạt điểm số cao nhất sẽ được vinh danh trên bục Podium cùng pháo hoa ăn mừng rực rỡ và nhận thưởng XP!
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
