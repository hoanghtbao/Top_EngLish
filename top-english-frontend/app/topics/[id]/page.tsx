/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang học từ vựng Flashcard 3D với Web Speech API và chế độ danh sách tra cứu
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  List,
  RotateCw,
  Search,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { speakText } from "../../../lib/speech";
import { useAuth } from "../../../context/auth-context";
import { fetchApi } from "../../../lib/api-client";

interface Topic {
  _id: string;
  title: string;
  slug: string;
  description: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  wordCount: number;
}

interface Vocabulary {
  _id: string;
  topicId: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence?: string;
  exampleMeaning?: string;
  audioUrl?: string;
}

function TopicDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex">
      <div className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen shrink-0" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80" />
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Đang chuẩn bị thẻ học từ vựng...
          </p>
        </div>
      </div>
    </div>
  );
}

function TopicDetailInner() {
  const params = useParams();
  const router = useRouter();
  const topicIdOrSlug = params?.id as string;
  const { isAuthenticated, updateStreakInfo } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"flashcard" | "list">("flashcard");

  // Flashcard states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // List mode state
  const [listSearch, setListSearch] = useState<string>("");

  useEffect(() => {
    if (!topicIdOrSlug) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

        // 1. Tải thông tin chủ đề
        const topicRes = await fetch(`${apiUrl}/topics/${topicIdOrSlug}`);
        const topicJson = await topicRes.json();

        if (topicJson.success && topicJson.data) {
          setTopic(topicJson.data);

          // 2. Tải danh sách từ vựng thuộc chủ đề
          const vocabRes = await fetch(
            `${apiUrl}/vocabularies/topic/${topicJson.data._id}`
          );
          const vocabJson = await vocabRes.json();
          if (vocabJson.success && Array.isArray(vocabJson.data)) {
            setVocabularies(vocabJson.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu thẻ từ vựng:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [topicIdOrSlug]);

  // Thưởng điểm XP và cập nhật Streak tức thì khi học viên hoàn thành toàn bộ chủ đề
  useEffect(() => {
    if (isCompleted && !rewardClaimed && isAuthenticated && vocabularies.length > 0) {
      setRewardClaimed(true);
      fetchApi<{
        streak: number;
        totalXP: number;
        streakIncreased: boolean;
        isNewStreakDay: boolean;
        streakMessage: string;
      }>("/streak/record", {
        method: "POST",
        body: JSON.stringify({ xpEarned: 25 }),
      })
        .then((res) => {
          if (res.success && res.data && updateStreakInfo) {
            updateStreakInfo({
              ...res.data,
              xpEarned: 25,
            });
          }
        })
        .catch((err) => console.error("Lỗi thưởng điểm XP:", err));
    }
  }, [isCompleted, rewardClaimed, isAuthenticated, vocabularies.length, updateStreakInfo]);

  const currentWord = vocabularies[currentIndex];

  const handlePronounce = useCallback(
    async (text: string) => {
      if (!text) return;
      setIsSpeaking(true);
      try {
        await speakText(text);
      } finally {
        setIsSpeaking(false);
      }
    },
    []
  );

  const handleNextCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, vocabularies.length]);

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleMarkKnown = useCallback(
    async (id: string) => {
      if (!knownWords.includes(id)) {
        setKnownWords((prev) => [...prev, id]);
      }

      // Ghi nhận ôn tập SRS và cập nhật Streak Realtime kiểu Duolingo
      if (isAuthenticated) {
        try {
          const res = await fetchApi<{
            streak: number;
            totalXP: number;
            xpEarned?: number;
            streakIncreased: boolean;
            isNewStreakDay: boolean;
            streakMessage: string;
          }>("/srs/review", {
            method: "POST",
            body: JSON.stringify({
              vocabularyId: id,
              rating: "good",
            }),
          });
          if (res.success && res.data && updateStreakInfo) {
            updateStreakInfo({
              ...res.data,
              xpEarned: res.data.xpEarned || 10,
            });
          }
        } catch (err) {
          console.error("Lỗi cập nhật tiến độ ôn tập:", err);
        }
      }

      handleNextCard();
    },
    [knownWords, handleNextCard, isAuthenticated, updateStreakInfo]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (viewMode !== "flashcard" || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleToggleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === "s" || e.key === "S") {
        if (currentWord) {
          e.preventDefault();
          handlePronounce(currentWord.word);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isCompleted, handleToggleFlip, handleNextCard, handlePrevCard, handlePronounce, currentWord]);

  const filteredVocabularies = vocabularies.filter((v) => {
    if (!listSearch.trim()) return true;
    const q = listSearch.toLowerCase();
    return (
      v.word.toLowerCase().includes(q) ||
      v.meaning.toLowerCase().includes(q) ||
      v.partOfSpeech.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <TopicDetailSkeleton />;
  }

  if (!topic) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Không tìm thấy chủ đề</h2>
          <p className="text-xs text-slate-500">
            Chủ đề bạn yêu cầu không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/topics"
            className="h-11 px-5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Quay lại danh mục chủ đề
          </Link>
        </div>
      </AppLayout>
    );
  }

  const progressPercent =
    vocabularies.length > 0
      ? Math.round(((currentIndex + 1) / vocabularies.length) * 100)
      : 0;

  return (
    <AppLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col">
        {/* Breadcrumb & Navigation Back */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href="/topics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ChevronLeft className="size-4" /> Danh mục chủ đề
          </Link>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setViewMode("flashcard")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "flashcard"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpen className="size-3.5" /> Thẻ Flashcard 3D
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "list"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <List className="size-3.5" /> Danh sách từ ({vocabularies.length})
            </button>
          </div>
        </div>

        {/* Topic Header Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                <GraduationCap className="size-3" /> CEFR {topic.level}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold">{topic.title}</h1>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              {topic.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
            <div className="text-center sm:text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Tổng số từ
              </span>
              <span className="text-base font-extrabold text-emerald-600">
                {vocabularies.length}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Đã thuộc
              </span>
              <span className="text-base font-extrabold text-teal-600">
                {knownWords.length}
              </span>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: FLASHCARD 3D */}
        {viewMode === "flashcard" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            {vocabularies.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 w-full">
                <p className="text-sm font-semibold text-slate-500">
                  Chủ đề này chưa có thẻ từ vựng nào.
                </p>
              </div>
            ) : isCompleted ? (
              /* Completed Deck Celebration View */
              <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-lg flex flex-col items-center gap-5">
                <div className="size-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shadow-inner">
                  <Trophy className="size-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-extrabold">
                    Chúc mừng bạn đã hoàn thành!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Bạn đã xem toàn bộ {vocabularies.length} từ vựng thuộc chủ đề &quot;{topic.title}&quot;. Tiếp tục duy trì chuỗi học để củng cố phản xạ nhé!
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold mt-1">
                    <Sparkles className="size-4 text-emerald-600 animate-spin" />
                    <span>+25 XP Đã Được Cộng Realtime!</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-xs py-2">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block">Đã ghi nhớ</span>
                    <span className="text-lg font-extrabold text-emerald-600">
                      {knownWords.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 block">Cần ôn lại</span>
                    <span className="text-lg font-extrabold text-amber-600">
                      {vocabularies.length - knownWords.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCurrentIndex(0);
                      setIsFlipped(false);
                      setIsCompleted(false);
                      setRewardClaimed(false);
                    }}
                    className="h-11 px-6 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <RotateCw className="size-4" /> Học lại từ đầu
                  </button>
                  <Link
                    href="/topics"
                    className="h-11 px-6 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-2"
                  >
                    Khám phá chủ đề khác
                  </Link>
                </div>
              </div>
            ) : (
              /* Active Flashcard 3D Card */
              <div className="w-full flex flex-col items-center gap-6">
                {/* Progress Bar & Indicators */}
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      Từ {currentIndex + 1} / {vocabularies.length}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {progressPercent}% hoàn thành
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 3D Flip Card Container */}
                <div
                  className="w-full h-[380px] sm:h-[420px] perspective-1000 cursor-pointer select-none"
                  onClick={handleToggleFlip}
                >
                  <div
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Front Face: Word + IPA + Audio */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xl p-8 flex flex-col justify-between items-center text-center backface-hidden">
                      <div className="w-full flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {currentWord.partOfSpeech}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Mặt trước
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3 my-auto">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                          {currentWord.word}
                        </h2>

                        {currentWord.phonetic && (
                          <span className="text-base sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {currentWord.phonetic}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePronounce(currentWord.word);
                          }}
                          className={`mt-2 size-12 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                            isSpeaking
                              ? "bg-emerald-500 text-white animate-pulse"
                              : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
                          }`}
                          title="Phát âm từ này (Nhấn phím S)"
                        >
                          <Volume2 className="size-6" />
                        </button>
                      </div>

                      <div className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <RotateCw className="size-3" />
                        <span>Chạm hoặc nhấn phím Cách (Space) để lật xem nghĩa</span>
                      </div>
                    </div>

                    {/* Back Face: Meaning + Example Sentence */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border-2 border-emerald-500/40 shadow-xl p-8 flex flex-col justify-between items-center text-center rotate-y-180 backface-hidden">
                      <div className="w-full flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                          Giải nghĩa & Ví dụ
                        </span>
                        <span className="text-[11px]">Mặt sau</span>
                      </div>

                      <div className="flex flex-col items-center gap-4 my-auto w-full">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                            Nghĩa tiếng Việt
                          </span>
                          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                            {currentWord.meaning}
                          </p>
                        </div>

                        {currentWord.exampleSentence && (
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-full text-left flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
                                &quot;{currentWord.exampleSentence}&quot;
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePronounce(currentWord.exampleSentence || "");
                                }}
                                className="shrink-0 size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-emerald-400 transition cursor-pointer"
                                title="Nghe câu ví dụ"
                              >
                                <Volume2 className="size-4" />
                              </button>
                            </div>
                            {currentWord.exampleMeaning && (
                              <p className="text-[11px] sm:text-xs text-slate-400">
                                👉 {currentWord.exampleMeaning}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <RotateCw className="size-3" />
                        <span>Chạm để lật lại mặt trước</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls & Navigation */}
                <div className="flex items-center justify-between w-full gap-3">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                    className="h-11 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">Từ trước</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleFlip}
                      className="h-11 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="size-4" />
                      <span>Lật thẻ</span>
                    </button>

                    <button
                      onClick={() => handleMarkKnown(currentWord._id)}
                      className="h-11 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Đã thuộc từ này</span>
                    </button>
                  </div>

                  <button
                    onClick={handleNextCard}
                    className="h-11 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="hidden sm:inline">
                      {currentIndex === vocabularies.length - 1 ? "Hoàn thành" : "Từ kế tiếp"}
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                  <span>Phím tắt:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">
                    Space: Lật thẻ
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">
                    ← / →: Chuyển từ
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">
                    S: Phát âm
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: VOCABULARY LIST TABLE */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {/* Search within topic */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                id="search-vocab"
                type="text"
                placeholder="Tra từ hoặc nghĩa tiếng Việt trong chủ đề..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100"
              />
            </div>

            {filteredVocabularies.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <p className="text-xs font-semibold text-slate-400">
                  Không tìm thấy từ vựng nào khớp với từ khóa &quot;{listSearch}&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVocabularies.map((item, idx) => (
                  <div
                    key={item._id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {item.word}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {item.partOfSpeech}
                          </span>
                        </div>
                        {item.phonetic && (
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {item.phonetic}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handlePronounce(item.word)}
                        className="size-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition cursor-pointer"
                        title="Phát âm từ"
                      >
                        <Volume2 className="size-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">
                          Nghĩa:
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.meaning}
                        </span>
                      </div>

                      {item.exampleSentence && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl flex flex-col gap-1 text-[11px]">
                          <p className="text-slate-700 dark:text-slate-300 italic">
                            &quot;{item.exampleSentence}&quot;
                          </p>
                          {item.exampleMeaning && (
                            <p className="text-slate-500 dark:text-slate-400">
                              👉 {item.exampleMeaning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

export default function TopicDetailPage() {
  return (
    <Suspense fallback={<TopicDetailSkeleton />}>
      <TopicDetailInner />
    </Suspense>
  );
}
