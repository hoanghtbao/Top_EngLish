/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang học từ vựng Flashcard 3D với Web Speech API và chế độ danh sách tra cứu
 * Tích hợp công cụ Quản lý / Soạn từ vựng (Thêm - Sửa - Xóa) dành cho Giáo viên (Teacher) và Quản trị viên (Admin)
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
  Edit2,
  GraduationCap,
  List,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { speakText } from "../../../lib/speech";
import { useAuth } from "../../../context/auth-context";
import { useSound } from "../../../context/sound-context";
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

const PARTS_OF_SPEECH = [
  { value: "noun", label: "Danh từ (Noun - n.)" },
  { value: "verb", label: "Động từ (Verb - v.)" },
  { value: "adjective", label: "Tính từ (Adjective - adj.)" },
  { value: "adverb", label: "Trạng từ (Adverb - adv.)" },
  { value: "preposition", label: "Giới từ (Preposition - prep.)" },
  { value: "conjunction", label: "Liên từ (Conjunction - conj.)" },
  { value: "phrase", label: "Cụm từ / Thành ngữ (Phrase / Idiom)" },
];

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
  const { user, isAuthenticated, updateStreakInfo } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();

  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

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

  // --- TEACHER & ADMIN AUTHORING MODAL STATES ---
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [showEditWordModal, setShowEditWordModal] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<Vocabulary | null>(null);
  const [isAuthoringSubmitting, setIsAuthoringSubmitting] = useState<boolean>(false);
  const [authoringError, setAuthoringError] = useState<string | null>(null);
  const [authoringSuccess, setAuthoringSuccess] = useState<string | null>(null);

  const [wordForm, setWordForm] = useState({
    word: "",
    phonetic: "",
    partOfSpeech: "noun",
    meaning: "",
    exampleSentence: "",
    exampleMeaning: "",
  });

  const loadData = useCallback(async () => {
    if (!topicIdOrSlug) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

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

        // Đồng bộ danh sách từ đã thuộc từ bộ nhớ cục bộ
        try {
          const stored = localStorage.getItem(`topenglish_known_words_${topicJson.data._id}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setKnownWords(parsed);
            }
          }
        } catch {}
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu thẻ từ vựng:", err);
    } finally {
      setLoading(false);
    }
  }, [topicIdOrSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    playClickSound();
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, vocabularies.length, playClickSound]);

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    playClickSound();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, playClickSound]);

  const handleToggleFlip = useCallback(() => {
    playClickSound();
    setIsFlipped((prev) => !prev);
  }, [playClickSound]);

  const handleMarkKnown = useCallback(
    async (id: string) => {
      playClickSound();
      if (!knownWords.includes(id)) {
        const nextKnown = [...knownWords, id];
        setKnownWords(nextKnown);
        try {
          if (topic?._id) {
            localStorage.setItem(`topenglish_known_words_${topic._id}`, JSON.stringify(nextKnown));
            if (topic.slug) {
              localStorage.setItem(`topenglish_known_words_${topic.slug}`, JSON.stringify(nextKnown));
            }
          }
        } catch {}
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
    [knownWords, handleNextCard, isAuthenticated, updateStreakInfo, playClickSound]
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

  // --- TEACHER ACTION HANDLERS ---
  // Mở modal thêm từ vựng mới
  const openAddModal = () => {
    playClickSound();
    setAuthoringError(null);
    setWordForm({
      word: "",
      phonetic: "",
      partOfSpeech: "noun",
      meaning: "",
      exampleSentence: "",
      exampleMeaning: "",
    });
    setShowAddWordModal(true);
  };

  // Mở modal sửa từ vựng
  const openEditModal = (item: Vocabulary) => {
    playClickSound();
    setAuthoringError(null);
    setEditingWord(item);
    setWordForm({
      word: item.word,
      phonetic: item.phonetic || "",
      partOfSpeech: item.partOfSpeech || "noun",
      meaning: item.meaning || "",
      exampleSentence: item.exampleSentence || "",
      exampleMeaning: item.exampleMeaning || "",
    });
    setShowEditWordModal(true);
  };

  // Submit tạo từ vựng mới
  const handleCreateVocabulary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic?._id) return;
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      setAuthoringError("Vui lòng điền đầy đủ Từ tiếng Anh và Nghĩa tiếng Việt!");
      return;
    }

    try {
      setIsAuthoringSubmitting(true);
      setAuthoringError(null);

      const payload = {
        topicId: topic._id,
        word: wordForm.word.trim(),
        phonetic: wordForm.phonetic.trim() || undefined,
        partOfSpeech: wordForm.partOfSpeech,
        meaning: wordForm.meaning.trim(),
        exampleSentence: wordForm.exampleSentence.trim() || undefined,
        exampleMeaning: wordForm.exampleMeaning.trim() || undefined,
      };

      const res = await fetchApi<Vocabulary>("/vocabularies", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setAuthoringSuccess(`Đã thêm thành công từ vựng "${res.data.word}"!`);
        setShowAddWordModal(false);
        // Cập nhật danh sách từ vựng cục bộ
        setVocabularies((prev) => [...prev, res.data!]);
        // Cập nhật wordCount chủ đề
        setTopic((prev) => (prev ? { ...prev, wordCount: prev.wordCount + 1 } : prev));
      } else {
        setAuthoringError(res.message || "Không thể tạo từ vựng. Vui lòng thử lại!");
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm từ vựng:", err);
      setAuthoringError(err.message || "Thêm từ vựng thất bại. Vui lòng kiểm tra quyền Giáo viên!");
    } finally {
      setIsAuthoringSubmitting(false);
    }
  };

  // Submit sửa từ vựng
  const handleUpdateVocabulary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord?._id) return;
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      setAuthoringError("Vui lòng điền đầy đủ Từ tiếng Anh và Nghĩa tiếng Việt!");
      return;
    }

    try {
      setIsAuthoringSubmitting(true);
      setAuthoringError(null);

      const payload = {
        word: wordForm.word.trim(),
        phonetic: wordForm.phonetic.trim() || undefined,
        partOfSpeech: wordForm.partOfSpeech,
        meaning: wordForm.meaning.trim(),
        exampleSentence: wordForm.exampleSentence.trim() || undefined,
        exampleMeaning: wordForm.exampleMeaning.trim() || undefined,
      };

      const res = await fetchApi<Vocabulary>(`/vocabularies/${editingWord._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setAuthoringSuccess(`Đã cập nhật từ vựng "${res.data.word}"!`);
        setShowEditWordModal(false);
        // Cập nhật danh sách từ vựng cục bộ
        setVocabularies((prev) =>
          prev.map((v) => (v._id === editingWord._id ? res.data! : v))
        );
      } else {
        setAuthoringError(res.message || "Không thể cập nhật từ vựng. Vui lòng thử lại!");
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật từ vựng:", err);
      setAuthoringError(err.message || "Cập nhật từ vựng thất bại!");
    } finally {
      setIsAuthoringSubmitting(false);
    }
  };

  // Xóa từ vựng
  const handleDeleteVocabulary = async (item: Vocabulary) => {
    playClickSound();
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa từ vựng "${item.word}" khỏi chủ đề này không? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      const res = await fetchApi(`/vocabularies/${item._id}`, {
        method: "DELETE",
      });

      if (res.success) {
        playClickSound();
        setAuthoringSuccess(`Đã xóa từ vựng "${item.word}"!`);
        setVocabularies((prev) => prev.filter((v) => v._id !== item._id));
        setTopic((prev) =>
          prev ? { ...prev, wordCount: Math.max(0, prev.wordCount - 1) } : prev
        );
      } else {
        alert(res.message || "Không thể xóa từ vựng!");
      }
    } catch (err: any) {
      console.error("Lỗi xóa từ vựng:", err);
      alert(err.message || "Xóa từ vựng thất bại!");
    }
  };

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col gap-6">
        {/* Breadcrumb & Navigation Back */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/topics"
            onClick={() => playClickSound()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ChevronLeft className="size-4" /> Danh mục chủ đề
          </Link>

          {/* Action Row: Mode Switcher & Teacher Authoring Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("flashcard");
                }}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "flashcard"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className="size-3.5" /> Thẻ Flashcard 3D
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("list");
                }}
                className={`h-9 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <List className="size-3.5" /> Danh sách từ ({vocabularies.length})
              </button>
            </div>

            {/* Teacher / Admin: Nút Thêm Từ Vựng Mới */}
            {isTeacherOrAdmin && (
              <button
                type="button"
                onClick={openAddModal}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="size-4 stroke-[3]" />
                <span>Thêm từ vựng mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Thông báo thành công */}
        {authoringSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{authoringSuccess}</span>
            </div>
            <button
              onClick={() => setAuthoringSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Topic Header Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 w-full flex flex-col items-center gap-3">
                <BookOpen className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">
                  Chủ đề này chưa có thẻ từ vựng nào.
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="size-4" /> Soạn thêm từ vựng đầu tiên
                  </button>
                )}
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
                    <span className="text-[11px] text-slate-400 block">Tổng số từ</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {vocabularies.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      playClickSound();
                      setCurrentIndex(0);
                      setIsCompleted(false);
                      setIsFlipped(false);
                    }}
                    className="h-11 px-6 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    Học lại từ đầu
                  </button>
                  <Link
                    href="/topics"
                    onClick={() => playClickSound()}
                    className="h-11 px-6 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Khám phá chủ đề khác</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Active Flashcard 3D Presentation */
              <div className="w-full flex flex-col items-center gap-6">
                {/* Progress Indicators */}
                <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>
                    Thẻ {currentIndex + 1} / {vocabularies.length}
                  </span>
                  <span className="text-emerald-600">{progressPercent}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 3D Flip Card Container */}
                <div
                  onClick={handleToggleFlip}
                  className="w-full h-84 sm:h-96 perspective-1000 cursor-pointer select-none group"
                >
                  <div
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* FRONT SIDE: WORD + IPA + AUDIO */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col justify-between items-center text-center backface-hidden">
                      <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold tracking-wider">
                          Mặt trước: Từ vựng
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold uppercase">
                          {currentWord?.partOfSpeech || "noun"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
                          {currentWord?.word}
                        </h2>

                        {currentWord?.phonetic && (
                          <span className="text-base sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                            {currentWord.phonetic}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentWord) handlePronounce(currentWord.word);
                          }}
                          disabled={isSpeaking}
                          className="mt-2 size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                          title="Bấm để nghe phát âm giọng chuẩn"
                        >
                          <Volume2
                            className={`size-6 ${
                              isSpeaking ? "animate-bounce text-emerald-400" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <RotateCw className="size-3" />
                        <span>Chạm để lật xem định nghĩa tiếng Việt</span>
                      </div>
                    </div>

                    {/* BACK SIDE: MEANING + EXAMPLE */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl p-8 flex flex-col justify-between items-center text-center rotate-y-180 backface-hidden">
                      <div className="w-full flex items-center justify-between text-xs font-semibold text-emerald-100">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] uppercase font-bold tracking-wider">
                          Mặt sau: Định nghĩa & Ví dụ
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold uppercase">
                          {currentWord?.partOfSpeech}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3 max-w-md">
                        <span className="text-xs text-emerald-200 uppercase font-bold tracking-wider">
                          Ý nghĩa tiếng Việt
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black drop-shadow-sm leading-snug">
                          {currentWord?.meaning}
                        </h3>

                        {currentWord?.exampleSentence && (
                          <div className="mt-2 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs sm:text-sm text-emerald-50 flex flex-col gap-1 text-left w-full">
                            <span className="text-[10px] uppercase font-bold text-emerald-200">
                              Ví dụ ngữ cảnh:
                            </span>
                            <p className="italic font-medium">
                              &quot;{currentWord.exampleSentence}&quot;
                            </p>
                            {currentWord.exampleMeaning && (
                              <p className="text-emerald-100/90 text-[11px]">
                                👉 {currentWord.exampleMeaning}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="w-full flex items-center justify-center gap-1 text-[11px] text-emerald-200">
                        <RotateCw className="size-3" />
                        <span>Chạm để lật lại mặt trước</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls & Navigation */}
                <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                    className="h-11 px-3 sm:px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">Từ trước</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleFlip}
                      className="h-11 px-3 sm:px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw className="size-4" />
                      <span>Lật thẻ</span>
                    </button>

                    <button
                      onClick={() => handleMarkKnown(currentWord._id)}
                      className="h-11 px-3 sm:px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span className="hidden sm:inline">Đã thuộc từ này</span>
                      <span className="sm:hidden">Đã thuộc</span>
                    </button>
                  </div>

                  <button
                    onClick={handleNextCard}
                    className="h-11 px-3 sm:px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shrink-0"
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
            {/* Search within topic & Quick Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

              {isTeacherOrAdmin && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="size-4" />
                  <span>Thêm từ vựng mới</span>
                </button>
              )}
            </div>

            {filteredVocabularies.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center gap-3">
                <p className="text-xs font-semibold text-slate-400">
                  Không tìm thấy từ vựng nào khớp với từ khóa &quot;{listSearch}&quot;.
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="size-4" /> Thêm từ mới vào chủ đề
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVocabularies.map((item, idx) => (
                  <div
                    key={item._id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-500/50 transition-colors relative group"
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

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePronounce(item.word)}
                          className="size-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition cursor-pointer"
                          title="Phát âm từ"
                        >
                          <Volume2 className="size-4" />
                        </button>

                        {/* Teacher & Admin: Edit / Delete action buttons */}
                        {isTeacherOrAdmin && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                              title="Sửa từ vựng này"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVocabulary(item)}
                              className="size-9 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center transition cursor-pointer"
                              title="Xóa từ vựng này"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
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

        {/* MODAL: THÊM TỪ VỰNG MỚI (DÀNH CHO GIÁO VIÊN & ADMIN) */}
        {showAddWordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Plus className="size-5 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Thêm Từ Vựng Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chủ đề: <span className="font-semibold text-emerald-600">{topic.title}</span> ({topic.level})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {authoringError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {authoringError}
                </div>
              )}

              <form onSubmit={handleCreateVocabulary} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ tiếng Anh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Innovation"
                      value={wordForm.word}
                      onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                      className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phiên âm quốc tế IPA
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: /ˌɪn.əˈveɪ.ʃən/"
                      value={wordForm.phonetic}
                      onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })}
                      className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Từ loại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wordForm.partOfSpeech}
                    onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {PARTS_OF_SPEECH.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sự đổi mới, sự sáng tạo mang tính đột phá"
                    value={wordForm.meaning}
                    onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Câu ví dụ minh họa (Tiếng Anh)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Technological innovation is changing how we learn languages."
                    value={wordForm.exampleSentence}
                    onChange={(e) => setWordForm({ ...wordForm, exampleSentence: e.target.value })}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dịch nghĩa câu ví dụ (Tiếng Việt)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sự đổi mới công nghệ đang thay đổi cách chúng ta học ngôn ngữ."
                    value={wordForm.exampleMeaning}
                    onChange={(e) => setWordForm({ ...wordForm, exampleMeaning: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddWordModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthoringSubmitting}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
                  >
                    {isAuthoringSubmitting ? "Đang lưu..." : "Thêm Từ Vựng"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SỬA TỪ VỰNG (DÀNH CHO GIÁO VIÊN & ADMIN) */}
        {showEditWordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Edit2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Cập Nhật Từ Vựng
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chỉnh sửa định nghĩa hoặc câu ví dụ của thẻ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditWordModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              {authoringError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {authoringError}
                </div>
              )}

              <form onSubmit={handleUpdateVocabulary} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ tiếng Anh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={wordForm.word}
                      onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                      className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phiên âm quốc tế IPA
                    </label>
                    <input
                      type="text"
                      value={wordForm.phonetic}
                      onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })}
                      className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Từ loại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wordForm.partOfSpeech}
                    onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {PARTS_OF_SPEECH.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={wordForm.meaning}
                    onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Câu ví dụ minh họa (Tiếng Anh)
                  </label>
                  <textarea
                    rows={2}
                    value={wordForm.exampleSentence}
                    onChange={(e) => setWordForm({ ...wordForm, exampleSentence: e.target.value })}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dịch nghĩa câu ví dụ (Tiếng Việt)
                  </label>
                  <input
                    type="text"
                    value={wordForm.exampleMeaning}
                    onChange={(e) => setWordForm({ ...wordForm, exampleMeaning: e.target.value })}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditWordModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthoringSubmitting}
                    className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-teal-600/30 cursor-pointer"
                  >
                    {isAuthoringSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
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

export default function TopicDetailPage() {
  return (
    <Suspense fallback={<TopicDetailSkeleton />}>
      <TopicDetailInner />
    </Suspense>
  );
}
