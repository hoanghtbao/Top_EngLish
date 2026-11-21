/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Phòng Luyện Thi & Kiểm Tra Kiến Thức — Cho phép chọn nhiều bài Flashcard + Ngữ pháp, chọn số câu và Random đề thi bấm giờ
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  FolderOpen,
  Globe2,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  Wand2,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import PageHeaderBanner from "../../components/PageHeaderBanner";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface SourceTopic {
  _id: string;
  title: string;
  slug: string;
  lessonNumber: number;
  level: string;
  tag: string;
  wordCount: number;
}

interface SourceVocabClass {
  _id: string;
  name: string;
  code: string;
  description: string;
  totalWords: number;
  topics: SourceTopic[];
}

interface SourceGrammarLesson {
  _id: string;
  title: string;
  slug: string;
  level: string;
  category: string;
  exerciseCount: number;
}

interface PracticeSourcesResponse {
  vocabClasses: SourceVocabClass[];
  ungroupedTopics: SourceTopic[];
  grammarLessons: SourceGrammarLesson[];
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  type: "vocabulary" | "grammar" | "general";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
  isCustomPractice?: boolean;
  createdAt?: string;
  topicId?: { _id: string; title: string; slug: string };
  grammarLessonId?: { _id: string; title: string; slug: string };
  sourceTopicIds?: Array<{ _id: string; title: string; lessonNumber?: number }>;
  sourceGrammarLessonIds?: Array<{ _id: string; title: string; level?: string }>;
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

type VocabQuestionMode = "mixed_abcd" | "en_to_vi" | "vi_to_en" | "mixed_all";

const CEFR_LEVELS = [
  { key: "ALL", label: "Tất cả" },
  { key: "A1", label: "A1" },
  { key: "A2", label: "A2" },
  { key: "B1", label: "B1" },
  { key: "B2", label: "B2" },
  { key: "C1", label: "C1" },
  { key: "C2", label: "C2" },
];

const QUESTION_PRESETS = [10, 15, 20, 30, 50];

export default function QuizzesCatalogPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Nguồn dữ liệu bài học (Flashcard + Ngữ pháp)
  const [sources, setSources] = useState<PracticeSourcesResponse>({
    vocabClasses: [],
    ungroupedTopics: [],
    grammarLessons: [],
  });
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [expandedClassIds, setExpandedClassIds] = useState<Record<string, boolean>>({});
  const [sourceTab, setSourceTab] = useState<"flashcard" | "grammar">("flashcard");

  // Lựa chọn tạo đề ngẫu nhiên
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedGrammarIds, setSelectedGrammarIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [vocabMode, setVocabMode] = useState<VocabQuestionMode>("mixed_abcd");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string>("");

  // Danh sách đề tự luyện & đề công khai
  const [myCustomQuizzes, setMyCustomQuizzes] = useState<Quiz[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(true);
  const [listTab, setListTab] = useState<"custom" | "public">("custom");

  // Bộ lọc cho đề công khai
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tải nguồn bài học Flashcard & Ngữ pháp
  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const res = await fetchApi<PracticeSourcesResponse>("/quizzes/sources");
        if (res.success && res.data) {
          setSources(res.data);
          // Tự động mở rộng các lớp đang có bài học
          const initialExpanded: Record<string, boolean> = {};
          res.data.vocabClasses.forEach((cls) => {
            if (cls.topics.length > 0) {
              initialExpanded[cls._id] = true;
            }
          });
          if (res.data.ungroupedTopics.length > 0) {
            initialExpanded["ungrouped"] = true;
          }
          setExpandedClassIds(initialExpanded);
        }
      } catch (err) {
        console.error("Lỗi khi tải nguồn bài học luyện thi:", err);
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, []);

  // Tải lịch sử làm bài & danh sách đề tự luyện của học viên
  const fetchPersonalData = useCallback(async () => {
    if (!isAuthenticated) {
      setMyCustomQuizzes([]);
      setSubmissions([]);
      return;
    }
    try {
      const [subRes, customRes] = await Promise.all([
        fetchApi<Submission[]>("/quizzes/my-submissions"),
        fetchApi<Quiz[]>("/quizzes/my-custom"),
      ]);
      if (subRes.success && Array.isArray(subRes.data)) {
        setSubmissions(subRes.data);
      }
      if (customRes.success && Array.isArray(customRes.data)) {
        setMyCustomQuizzes(customRes.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu luyện thi cá nhân:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPersonalData();
  }, [fetchPersonalData]);

  // Tải danh sách đề thi công khai theo bộ lọc
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedType !== "ALL") queryParams.append("type", selectedType);
        if (selectedLevel !== "ALL") queryParams.append("level", selectedLevel);
        if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

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
        setLoadingQuizzes(false);
      }
    };

    const timer = setTimeout(fetchQuizzes, 200);
    return () => clearTimeout(timer);
  }, [selectedType, selectedLevel, searchQuery]);

  // Tính tổng số câu khả dụng từ các bài học đã tick chọn
  const allTopicsMap = useMemo(() => {
    const map = new Map<string, SourceTopic>();
    sources.vocabClasses.forEach((cls) => {
      cls.topics.forEach((t) => map.set(t._id, t));
    });
    sources.ungroupedTopics.forEach((t) => map.set(t._id, t));
    return map;
  }, [sources]);

  const allGrammarMap = useMemo(() => {
    const map = new Map<string, SourceGrammarLesson>();
    sources.grammarLessons.forEach((g) => map.set(g._id, g));
    return map;
  }, [sources]);

  const selectedVocabCount = useMemo(
    () =>
      selectedTopicIds.reduce(
        (sum, id) => sum + (allTopicsMap.get(id)?.wordCount || 0),
        0
      ),
    [selectedTopicIds, allTopicsMap]
  );

  const selectedGrammarCount = useMemo(
    () =>
      selectedGrammarIds.reduce(
        (sum, id) => sum + (allGrammarMap.get(id)?.exerciseCount || 0),
        0
      ),
    [selectedGrammarIds, allGrammarMap]
  );

  const totalAvailableQuestions = selectedVocabCount + selectedGrammarCount;
  const maxAllowedQuestions = Math.min(100, totalAvailableQuestions);
  const effectiveQuestionCount =
    totalAvailableQuestions === 0
      ? 0
      : Math.max(1, Math.min(questionCount, maxAllowedQuestions));

  // Tự động gợi ý thời gian hợp lý khi số câu thay đổi
  useEffect(() => {
    if (effectiveQuestionCount > 0) {
      setDurationMinutes(Math.max(5, Math.min(90, Math.ceil(effectiveQuestionCount * 0.75))));
    }
  }, [effectiveQuestionCount]);

  // Toggle chọn 1 bài Flashcard
  const toggleTopic = (topicId: string) => {
    setGenerateError("");
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  // Chọn / Bỏ chọn toàn bộ các bài có từ vựng trong 1 lớp
  const toggleWholeClass = (topics: SourceTopic[]) => {
    setGenerateError("");
    const eligibleIds = topics.filter((t) => t.wordCount > 0).map((t) => t._id);
    if (eligibleIds.length === 0) return;

    const allSelected = eligibleIds.every((id) => selectedTopicIds.includes(id));
    if (allSelected) {
      setSelectedTopicIds((prev) => prev.filter((id) => !eligibleIds.includes(id)));
    } else {
      setSelectedTopicIds((prev) => Array.from(new Set([...prev, ...eligibleIds])));
    }
  };

  // Toggle chọn 1 bài Ngữ pháp
  const toggleGrammar = (lessonId: string) => {
    setGenerateError("");
    setSelectedGrammarIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  // Chọn / Bỏ chọn tất cả bài Ngữ pháp có bài tập
  const toggleAllGrammar = () => {
    setGenerateError("");
    const eligibleIds = sources.grammarLessons
      .filter((g) => g.exerciseCount > 0)
      .map((g) => g._id);
    if (eligibleIds.length === 0) return;

    const allSelected = eligibleIds.every((id) => selectedGrammarIds.includes(id));
    if (allSelected) {
      setSelectedGrammarIds([]);
    } else {
      setSelectedGrammarIds(eligibleIds);
    }
  };

  const handleGenerateCustomQuiz = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (selectedTopicIds.length === 0 && selectedGrammarIds.length === 0) {
      setGenerateError("Hãy chọn ít nhất 1 bài học Từ vựng hoặc Ngữ pháp.");
      return;
    }

    if (totalAvailableQuestions === 0) {
      setGenerateError("Các bài học bạn chọn chưa có từ vựng hoặc câu hỏi nào.");
      return;
    }

    setGenerateError("");
    setIsGenerating(true);

    try {
      const res = await fetchApi<Quiz>("/quizzes/generate-custom", {
        method: "POST",
        body: JSON.stringify({
          title: customTitle.trim() || undefined,
          topicIds: selectedTopicIds,
          grammarLessonIds: selectedGrammarIds,
          questionCount: effectiveQuestionCount,
          durationMinutes,
          vocabQuestionMode: vocabMode,
        }),
      });

      if (res.success && res.data?._id) {
        router.push(`/quizzes/${res.data._id}`);
      } else {
        setGenerateError(res.message || "Không thể tạo đề luyện thi lúc này.");
      }
    } catch (err: any) {
      setGenerateError(err?.message || "Đã xảy ra lỗi khi tạo đề luyện thi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCustomQuiz = async (quizId: string) => {
    try {
      const res = await fetchApi(`/quizzes/${quizId}`, { method: "DELETE" });
      if (res.success) {
        setMyCustomQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      }
    } catch (err) {
      console.error("Lỗi khi xóa đề tự luyện:", err);
    }
  };

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

  const getQuizTypeLabel = (type: Quiz["type"]) => {
    if (type === "vocabulary") return "Từ vựng";
    if (type === "grammar") return "Ngữ pháp";
    return "Tổng hợp";
  };

  const renderTopicGrid = (topics: SourceTopic[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
      {topics.map((topic) => {
        const isSelected = selectedTopicIds.includes(topic._id);
        const disabled = topic.wordCount === 0;

        return (
          <button
            key={topic._id}
            type="button"
            disabled={disabled}
            onClick={() => toggleTopic(topic._id)}
            className={`text-left p-3 rounded-2xl border transition flex items-start gap-3 ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                : isSelected
                ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs cursor-pointer"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 cursor-pointer"
            }`}
          >
            <div
              className={`size-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                isSelected
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              }`}
            >
              {isSelected && <Check className="size-3.5 stroke-[3]" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                  Bài {topic.lessonNumber}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  {topic.wordCount} từ
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mt-0.5 leading-snug">
                {topic.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderQuizCard = (quiz: Quiz, isCustomOwnerCard = false) => {
    const bestAttempt = getBestScore(quiz._id);

    return (
      <div
        key={quiz._id}
        className="group flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300"
      >
        <div className="flex flex-col gap-3.5">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black border uppercase ${getLevelBadge(
                  quiz.level
                )}`}
              >
                <GraduationCap className="size-3" /> CEFR {quiz.level}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                {quiz.type === "vocabulary" ? (
                  <BookOpen className="size-3" />
                ) : quiz.type === "grammar" ? (
                  <GraduationCap className="size-3" />
                ) : (
                  <Shuffle className="size-3" />
                )}
                {getQuizTypeLabel(quiz.type)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {bestAttempt && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    bestAttempt.passed
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200"
                  }`}
                >
                  <Trophy className="size-3" /> {bestAttempt.score}%
                </span>
              )}

              {isCustomOwnerCard && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomQuiz(quiz._id)}
                  title="Xóa đề tự luyện này"
                  className="size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quiz Title */}
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            {quiz.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {quiz.description || "Bài kiểm tra đánh giá kiến thức tổng hợp."}
          </p>

          {/* Source lessons pills for custom quizzes */}
          {(quiz.sourceTopicIds?.length || quiz.sourceGrammarLessonIds?.length) ? (
            <div className="flex flex-wrap gap-1.5">
              {quiz.sourceTopicIds?.slice(0, 3).map((t) => (
                <span
                  key={t._id}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                >
                  {t.lessonNumber ? `Bài ${t.lessonNumber}: ` : ""}
                  {t.title}
                </span>
              ))}
              {quiz.sourceGrammarLessonIds?.slice(0, 2).map((g) => (
                <span
                  key={g._id}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                >
                  {g.title}
                </span>
              ))}
              {((quiz.sourceTopicIds?.length || 0) > 3 ||
                (quiz.sourceGrammarLessonIds?.length || 0) > 2) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                  + nhiều bài khác
                </span>
              )}
            </div>
          ) : null}

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
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-semibold">
            Thưởng <strong className="text-amber-500 font-bold">+10 XP/câu</strong>
          </span>
          <Link
            href={`/quizzes/${quiz._id}`}
            className="h-10 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-emerald-600 group-hover:text-white shadow-xs"
          >
            <span>{bestAttempt ? "Thi lại đề này" : "Bắt đầu làm bài"}</span>
            <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    );
  };

  const totalSystemQuestionBank = useMemo(() => {
    const vocabTotal =
      sources.vocabClasses.reduce((s, c) => s + (c.totalWords || 0), 0) +
      sources.ungroupedTopics.reduce((s, t) => s + (t.wordCount || 0), 0);
    const grammarTotal = sources.grammarLessons.reduce(
      (s, g) => s + (g.exerciseCount || 0),
      0
    );
    return vocabTotal + grammarTotal;
  }, [sources]);

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7">
        {/* Balanced Page Header Banner */}
        <PageHeaderBanner
          badgeIcon={<Sparkles className="size-3.5" />}
          badgeText="Phòng Luyện Thi Tổng Hợp • Tự Chọn & Random Câu Hỏi"
          title="Luyện thi & Kiểm tra kiến thức"
          description="Chọn một hoặc nhiều bài học Từ vựng Flashcard và Ngữ pháp bạn muốn ôn tập, đặt số câu muốn thi — hệ thống sẽ random ngẫu nhiên từ tổng ngân hàng các bài đã chọn thành đề thi bấm giờ chuẩn xác."
          stats={[
            {
              icon: <Layers className="size-4" />,
              label: "Kho câu hỏi",
              value: loadingSources ? "..." : totalSystemQuestionBank,
            },
            {
              icon: <Lock className="size-4" />,
              label: "Đề của tôi",
              value: myCustomQuizzes.length,
            },
            {
              icon: <Globe2 className="size-4" />,
              label: "Đề hệ thống",
              value: quizzes.length,
            },
          ]}
        />

        {/* SECTION 1: RANDOM PRACTICE QUIZ BUILDER */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Shuffle className="size-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Tạo Đề Thi Ngẫu Nhiên Theo Bài Học
                </h2>
                <p className="text-xs text-slate-500">
                  Có thể chọn kết hợp cả Từ vựng Flashcard và Ngữ pháp trong cùng một đề thi
                </p>
              </div>
            </div>

            {(selectedTopicIds.length > 0 || selectedGrammarIds.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopicIds([]);
                  setSelectedGrammarIds([]);
                  setGenerateError("");
                }}
                className="self-start sm:self-auto text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 transition cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-start">
            {/* LEFT: LESSON PICKER */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Source Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setSourceTab("flashcard")}
                  className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    sourceTab === "flashcard"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="size-4" />
                  <span>Bài Từ vựng Flashcard</span>
                  {selectedTopicIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                      {selectedTopicIds.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceTab("grammar")}
                  className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    sourceTab === "grammar"
                      ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="size-4" />
                  <span>Bài Ngữ pháp</span>
                  {selectedGrammarIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                      {selectedGrammarIds.length}
                    </span>
                  )}
                </button>
              </div>

              {loadingSources ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="size-7 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold">
                    Đang tải danh sách bài học Flashcard và Ngữ pháp...
                  </span>
                </div>
              ) : sourceTab === "flashcard" ? (
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {sources.vocabClasses.map((cls) => {
                    const isExpanded = !!expandedClassIds[cls._id];
                    const eligibleTopics = cls.topics.filter((t) => t.wordCount > 0);
                    const selectedInClass = eligibleTopics.filter((t) =>
                      selectedTopicIds.includes(t._id)
                    ).length;
                    const allInClassSelected =
                      eligibleTopics.length > 0 &&
                      selectedInClass === eligibleTopics.length;

                    return (
                      <div
                        key={cls._id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedClassIds((prev) => ({
                                ...prev,
                                [cls._id]: !prev[cls._id],
                              }))
                            }
                            className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                          >
                            <ChevronDown
                              className={`size-4 text-slate-400 transition-transform shrink-0 ${
                                isExpanded ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                              {cls.code}
                            </span>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {cls.name}
                            </span>
                            <span className="text-[11px] text-slate-500 shrink-0">
                              ({cls.topics.length} bài • {cls.totalWords} từ)
                            </span>
                          </button>

                          {eligibleTopics.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleWholeClass(cls.topics)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer ${
                                allInClassSelected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                              }`}
                            >
                              {allInClassSelected
                                ? `Đã chọn ${selectedInClass}/${eligibleTopics.length}`
                                : "Chọn cả lớp"}
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-2">
                            {cls.topics.length === 0 ? (
                              <p className="text-xs text-slate-400 py-2 pl-6">
                                Lớp này chưa có bài học nào.
                              </p>
                            ) : (
                              renderTopicGrid(cls.topics)
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sources.ungroupedTopics.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-white">
                          <FolderOpen className="size-4 text-slate-400" />
                          <span>Chủ đề Từ vựng độc lập</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWholeClass(sources.ungroupedTopics)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                      </div>
                      {renderTopicGrid(sources.ungroupedTopics)}
                    </div>
                  )}

                  {sources.vocabClasses.length === 0 &&
                    sources.ungroupedTopics.length === 0 && (
                      <div className="py-10 text-center text-xs text-slate-500">
                        Chưa có bài học Từ vựng nào trong hệ thống.
                      </div>
                    )}
                </div>
              ) : (
                /* TAB: GRAMMAR LESSONS */
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-500">
                      Chọn các bài Ngữ pháp có câu hỏi bài tập để trộn vào đề thi:
                    </span>
                    <button
                      type="button"
                      onClick={toggleAllGrammar}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                    >
                      Chọn / Bỏ chọn tất cả
                    </button>
                  </div>

                  {sources.grammarLessons.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500">
                      Chưa có bài Ngữ pháp nào được xuất bản.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {sources.grammarLessons.map((lesson) => {
                        const isSelected = selectedGrammarIds.includes(lesson._id);
                        const disabled = lesson.exerciseCount === 0;

                        return (
                          <button
                            key={lesson._id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleGrammar(lesson._id)}
                            className={`text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                              disabled
                                ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                                : isSelected
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs cursor-pointer"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer"
                            }`}
                          >
                            <div
                              className={`size-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check className="size-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                  CEFR {lesson.level} • {lesson.category}
                                </span>
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                  {lesson.exerciseCount} câu
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 leading-snug">
                                {lesson.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: QUIZ CONFIGURATION & SUMMARY */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-5">
              {/* Selection Summary */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Ngân hàng câu hỏi đã chọn
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Flashcard
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {selectedTopicIds.length} bài
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedVocabCount} từ
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Ngữ pháp
                    </span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {selectedGrammarIds.length} bài
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedGrammarCount} câu
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-600 text-white text-center shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-100 block">
                      Tổng kho
                    </span>
                    <span className="text-base font-black">
                      {totalAvailableQuestions}
                    </span>
                    <span className="text-[10px] text-emerald-100 block">câu hỏi</span>
                  </div>
                </div>
              </div>

              {/* Question Count Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="custom-q-count"
                    className="text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Số câu muốn random để thi
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Tối đa {maxAllowedQuestions || 100} câu
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUESTION_PRESETS.map((preset) => {
                    const disabled =
                      totalAvailableQuestions > 0 && preset > maxAllowedQuestions;
                    const active = effectiveQuestionCount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() => setQuestionCount(preset)}
                        className={`h-9 px-3 rounded-xl text-xs font-bold transition ${
                          disabled
                            ? "opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400"
                            : active
                            ? "bg-emerald-600 text-white shadow-xs cursor-pointer"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 cursor-pointer"
                        }`}
                      >
                        {preset} câu
                      </button>
                    );
                  })}

                  {totalAvailableQuestions > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuestionCount(maxAllowedQuestions)}
                      className={`h-9 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                        effectiveQuestionCount === maxAllowedQuestions
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                      }`}
                    >
                      Tất cả ({maxAllowedQuestions})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <input
                    id="custom-q-count"
                    type="number"
                    min={1}
                    max={maxAllowedQuestions || 100}
                    value={questionCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuestionCount(Number.isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    className="w-28 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-center text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">
                    Hoặc nhập trực tiếp số câu bất kỳ bạn muốn
                  </span>
                </div>
              </div>

              {/* Vocab Question Mode */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Dạng câu hỏi Từ vựng Flashcard
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "mixed_abcd", label: "Trộn ABCD (Anh ↔ Việt)" },
                    { key: "en_to_vi", label: "Anh → Việt (ABCD)" },
                    { key: "vi_to_en", label: "Việt → Anh (ABCD)" },
                    { key: "mixed_all", label: "Trộn ABCD + Gõ từ" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setVocabMode(m.key as VocabQuestionMode)}
                      className={`h-9 px-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                        vocabMode === m.key
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Custom Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="custom-duration"
                    className="text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Thời gian (phút)
                  </label>
                  <input
                    id="custom-duration"
                    type="number"
                    min={1}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 5))
                    }
                    className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="custom-quiz-title"
                    className="text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Tên đề (tùy chọn)
                  </label>
                  <input
                    id="custom-quiz-title"
                    type="text"
                    placeholder="Tự đặt tên nếu muốn..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {generateError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {generateError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateCustomQuiz}
                disabled={isGenerating || totalAvailableQuestions === 0}
                className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang trộn ngẫu nhiên câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" />
                    <span>
                      {totalAvailableQuestions > 0
                        ? `Random ${effectiveQuestionCount} Câu & Bắt Đầu Thi Ngay`
                        : "Chọn ít nhất 1 bài học để tạo đề"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: MY CUSTOM QUIZZES & PUBLIC QUIZZES */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setListTab("custom")}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  listTab === "custom"
                    ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Lock className="size-3.5" />
                <span>Đề Tự Luyện Của Tôi ({myCustomQuizzes.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  Riêng tư
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListTab("public")}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  listTab === "public"
                    ? "bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Globe2 className="size-3.5" />
                <span>Đề Chuẩn Hệ Thống ({quizzes.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                  Công khai
                </span>
              </button>
            </div>

            {listTab === "custom" ? (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                <Lock className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Riêng tư (Private — Chỉ mình bạn thấy):</strong> Danh sách đề tự luyện do
                  chính bạn tạo từ các bài Flashcard/Ngữ pháp đã chọn. Tài khoản khác sẽ không nhìn
                  thấy các đề này; bạn có thể bấm thi lại hoặc xóa bất cứ lúc nào.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200">
                <Globe2 className="size-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Công khai (Public — Bài chung toàn hệ thống):</strong> Bộ đề chuẩn do hệ
                  thống hoặc Giáo viên phát hành công khai để tất cả học viên cùng luyện tập và lưu
                  lịch sử điểm.
                </p>
              </div>
            )}
          </div>

          {listTab === "custom" ? (
            !isAuthenticated ? (
              <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
                <h3 className="text-base font-bold">
                  Đăng nhập để lưu và xem lại các đề tự luyện của bạn
                </h3>
                <Link
                  href="/login"
                  className="h-10 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : myCustomQuizzes.length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-2">
                <Shuffle className="size-8 text-slate-400" />
                <h3 className="text-base font-bold">Bạn chưa tạo đề tự luyện nào</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Hãy chọn các bài Flashcard hoặc Ngữ pháp ở khung phía trên rồi bấm{" "}
                  <strong>Random Câu & Bắt Đầu Thi Ngay</strong> nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCustomQuizzes.map((quiz) => renderQuizCard(quiz, true))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6">
              {/* Filter Controls Bar for Public Quizzes */}
              <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-400 mr-1 pl-1">
                    <Layers className="size-3.5" /> Phân loại:
                  </span>
                  {[
                    { key: "ALL", label: "Tất cả đề thi" },
                    { key: "vocabulary", label: "Từ vựng" },
                    { key: "grammar", label: "Ngữ pháp" },
                    { key: "general", label: "Tổng hợp" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedType(item.key)}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedType === item.key
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {item.label}
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
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

              {loadingQuizzes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
                  <CheckSquare className="size-8 text-slate-400" />
                  <h3 className="text-base font-bold">Không tìm thấy đề thi phù hợp</h3>
                  <button
                    onClick={() => {
                      setSelectedType("ALL");
                      setSelectedLevel("ALL");
                      setSearchQuery("");
                    }}
                    className="h-10 px-5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                  >
                    Xem tất cả đề thi
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quizzes.map((quiz) => renderQuizCard(quiz, false))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
