/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang học từ vựng Flashcard 3D với Web Speech API và chế độ danh sách tra cứu
 * Tích hợp công cụ Quản lý / Soạn từ vựng (Thêm - Sửa - Xóa) dành cho Giáo viên (Teacher) và Quản trị viên (Admin)
 */

"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Edit2,
  FileJson,
  HelpCircle,
  Keyboard,
  Layers,
  List,
  Plus,
  RotateCw,
  Search,
  Settings,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { speakText } from "../../../lib/speech";
import { useAuth } from "../../../context/auth-context";
import { useSound } from "../../../context/sound-context";
import { fetchApi } from "../../../lib/api-client";
import {
  DEFAULT_STUDY_SETTINGS,
  getDirectionBadgeLabel,
  loadStudySettings,
  saveStudySettings,
  StudyDirection,
  StudySessionSettings,
} from "../../../lib/study-settings";
import { StudySettingsModal } from "../../../components/StudySettingsModal";

interface Topic {
  _id: string;
  title: string;
  slug: string;
  description: string;
  vocabClassId?: { _id: string; name: string; code: string } | string | null;
  lessonNumber?: number;
  tag?: string;
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

const SAMPLE_JSON_TEMPLATE = `[
  {
    "word": "Collaborate",
    "phonetic": "/kəˈlæb.ə.reɪt/",
    "partOfSpeech": "verb",
    "meaning": "Hợp tác, cộng tác làm việc chung",
    "exampleSentence": "Our design and engineering teams collaborate closely every day.",
    "exampleMeaning": "Nhóm thiết kế và kỹ thuật của chúng tôi hợp tác chặt chẽ mỗi ngày."
  },
  {
    "word": "Efficiency",
    "phonetic": "/ɪˈfɪʃ.ən.si/",
    "partOfSpeech": "noun",
    "meaning": "Hiệu suất, năng suất làm việc",
    "exampleSentence": "Automation significantly improves operational efficiency.",
    "exampleMeaning": "Tự động hóa cải thiện đáng kể hiệu suất vận hành."
  }
]`;

function normalizePartOfSpeech(raw?: string): string {
  const val = (raw || "").trim().toLowerCase();
  if (val === "n" || val === "n." || val === "noun") return "noun";
  if (val === "v" || val === "v." || val === "verb") return "verb";
  if (val === "adj" || val === "adj." || val === "adjective") return "adjective";
  if (val === "adv" || val === "adv." || val === "adverb") return "adverb";
  if (val === "prep" || val === "prep." || val === "preposition") return "preposition";
  if (val === "conj" || val === "conj." || val === "conjunction") return "conjunction";
  if (val === "phrase" || val === "idiom") return "phrase";
  return "noun";
}

function isWordEnToVi(direction: StudyDirection, seedKey: string): boolean {
  if (direction === "en-vi") return true;
  if (direction === "vi-en") return false;
  const hash = seedKey.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return hash % 2 === 0;
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
  const { user, isAuthenticated, updateStreakInfo } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();

  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"flashcard" | "quiz" | "typing" | "list">("flashcard");

  // Study Session Settings (đồng bộ từ Lớp học)
  const [studySettings, setStudySettings] =
    useState<StudySessionSettings>(DEFAULT_STUDY_SETTINGS);
  const [showStudySettingsModal, setShowStudySettingsModal] = useState<boolean>(false);

  useEffect(() => {
    setStudySettings(loadStudySettings());
  }, []);

  const updateStudySettings = (patch: Partial<StudySessionSettings>) => {
    playClickSound();
    const next = { ...studySettings, ...patch };
    setStudySettings(next);
    saveStudySettings(next);
  };

  // Flashcard states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  // Quiz ABCD states (Chế độ 2. Quiz ABCD)
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const quizTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quizSeed, setQuizSeed] = useState<number>(0);

  // Typing states (Chế độ 3. Gõ Từ)
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const [typingInput, setTypingInput] = useState<string>("");
  const [typingStatus, setTypingStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [typingScore, setTypingScore] = useState<number>(0);
  const [typingFinished, setTypingFinished] = useState<boolean>(false);
  const [typingShowHint, setTypingShowHint] = useState<boolean>(false);

  // List mode state
  const [listSearch, setListSearch] = useState<string>("");

  // --- TEACHER & ADMIN AUTHORING MODAL STATES ---
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [addModalTab, setAddModalTab] = useState<"single" | "json">("single");
  const [jsonInput, setJsonInput] = useState<string>("");
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

  // Phân tích và kiểm tra tính hợp lệ của JSON nhập hàng loạt theo thời gian thực
  const parsedJsonPreview = useMemo(() => {
    const raw = jsonInput.trim();
    if (!raw) {
      return { items: [], error: null as string | null };
    }

    try {
      const parsed = JSON.parse(raw);
      const list: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
        ? parsed.items
        : Array.isArray(parsed?.vocabularies)
        ? parsed.vocabularies
        : null;

      if (!list) {
        return {
          items: [],
          error: 'JSON phải là một mảng [...] hoặc object chứa mảng "items" / "vocabularies".',
        };
      }

      if (list.length === 0) {
        return { items: [], error: "Danh sách từ vựng trong JSON đang rỗng." };
      }

      if (list.length > 200) {
        return { items: [], error: "Mỗi lần chỉ hỗ trợ nhập tối đa 200 từ vựng." };
      }

      const normalized: Array<{
        word: string;
        phonetic?: string;
        partOfSpeech: string;
        meaning: string;
        exampleSentence?: string;
        exampleMeaning?: string;
      }> = [];

      for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        if (!entry || typeof entry !== "object") {
          return { items: [], error: `Phần tử thứ ${i + 1} không phải là đối tượng JSON hợp lệ.` };
        }
        const word = typeof entry.word === "string" ? entry.word.trim() : "";
        const meaning = typeof entry.meaning === "string" ? entry.meaning.trim() : "";
        if (!word || !meaning) {
          return {
            items: [],
            error: `Mục thứ ${i + 1} bị thiếu trường bắt buộc "word" (từ tiếng Anh) hoặc "meaning" (nghĩa tiếng Việt).`,
          };
        }

        normalized.push({
          word,
          phonetic: typeof entry.phonetic === "string" ? entry.phonetic.trim() : undefined,
          partOfSpeech: normalizePartOfSpeech(
            typeof entry.partOfSpeech === "string" ? entry.partOfSpeech : undefined
          ),
          meaning,
          exampleSentence:
            typeof entry.exampleSentence === "string"
              ? entry.exampleSentence.trim()
              : typeof entry.example === "string"
              ? entry.example.trim()
              : undefined,
          exampleMeaning:
            typeof entry.exampleMeaning === "string"
              ? entry.exampleMeaning.trim()
              : typeof entry.exampleTranslation === "string"
              ? entry.exampleTranslation.trim()
              : undefined,
        });
      }

      return { items: normalized, error: null };
    } catch (err: any) {
      return {
        items: [],
        error: `Cú pháp JSON không hợp lệ: ${err?.message || "Vui lòng kiểm tra dấu ngoặc/dấu phẩy."}`,
      };
    }
  }, [jsonInput]);

  // Tự động chuyển mode học / tra cứu / soạn từ khi có query params
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "list") {
      setViewMode("list");
    } else if (mode === "quiz") {
      setViewMode("quiz");
    } else if (mode === "typing") {
      setViewMode("typing");
    } else if (mode === "flashcard") {
      setViewMode("flashcard");
    }

    const action = searchParams.get("action");
    if (action === "add" && isTeacherOrAdmin) {
      setViewMode("list");
      setShowAddWordModal(true);
    }
  }, [searchParams, isTeacherOrAdmin]);

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

  const isFlashcardEnToVi = useMemo(() => {
    if (!currentWord) return true;
    return isWordEnToVi(studySettings.direction, `fc-${currentWord._id}-${currentIndex}`);
  }, [studySettings.direction, currentWord, currentIndex]);

  // Tự động phát âm khi chuyển thẻ Flashcard nếu bật Phát âm
  useEffect(() => {
    if (
      viewMode === "flashcard" &&
      !isCompleted &&
      studySettings.autoAudio &&
      isFlashcardEnToVi &&
      currentWord?.word
    ) {
      speakText(currentWord.word).catch(() => {});
    }
  }, [viewMode, isCompleted, studySettings.autoAudio, isFlashcardEnToVi, currentWord]);

  // --- CHẾ ĐỘ 2: QUIZ ABCD TỰ ĐỘNG TỪ DANH SÁCH TỪ VỰNG ---
  const quizQuestions = useMemo(() => {
    if (vocabularies.length === 0) return [];
    // Xáo trộn có kiểm soát theo quizSeed
    const shuffled = [...vocabularies].sort((a, b) => {
      const ha = (a._id + quizSeed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hb = (b._id + quizSeed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return (ha % 17) - (hb % 17);
    });

    return shuffled.map((item, idx) => {
      const isEnToVi = isWordEnToVi(studySettings.direction, `quiz-${item._id}-${quizSeed}-${idx}`);
      const prompt = isEnToVi
        ? item.word
        : `Từ nào sau đây mang nghĩa "${item.meaning}"?`;
      const correct = isEnToVi ? item.meaning : item.word;

      const distractors = vocabularies
        .filter((v) => v._id !== item._id)
        .map((v) => (isEnToVi ? v.meaning : v.word))
        .filter((val, idx2, arr) => val !== correct && arr.indexOf(val) === idx2)
        .slice(0, 3);

      const options = [correct, ...distractors].sort((a, b) => {
        const ha = (a + item._id + quizSeed).length + a.charCodeAt(0);
        const hb = (b + item._id + quizSeed).length + b.charCodeAt(0);
        return (ha % 11) - (hb % 11);
      });

      return {
        vocab: item,
        isEnToVi,
        prompt,
        phonetic: item.phonetic || "",
        partOfSpeech: item.partOfSpeech,
        correct,
        options,
      };
    });
  }, [vocabularies, studySettings.direction, quizSeed]);

  const currentQuiz = quizQuestions[quizIndex];
  const quizSelectedOption = quizAnswers[quizIndex] ?? null;
  const quizScore = useMemo(
    () =>
      Object.entries(quizAnswers).filter(
        ([idx, ans]) => quizQuestions[Number(idx)]?.correct === ans
      ).length,
    [quizAnswers, quizQuestions]
  );

  const clearQuizTimer = useCallback(() => {
    if (quizTimerRef.current) {
      clearTimeout(quizTimerRef.current);
      quizTimerRef.current = null;
    }
  }, []);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearQuizTimer();
      clearTypingTimer();
    };
  }, [clearQuizTimer, clearTypingTimer]);

  // Tự động phát âm tiếng Anh khi sang câu Quiz mới (nếu bật Tự động phát âm)
  useEffect(() => {
    if (
      viewMode === "quiz" &&
      !quizFinished &&
      studySettings.autoAudio &&
      currentQuiz?.vocab?.word
    ) {
      speakText(currentQuiz.vocab.word).catch(() => {});
    }
  }, [viewMode, quizFinished, studySettings.autoAudio, quizIndex, currentQuiz?.vocab?.word]);

  const handleSelectQuizOption = (option: string) => {
    if (!currentQuiz || quizSelectedOption !== null) return;
    clearQuizTimer();
    setQuizAnswers((prev) => ({ ...prev, [quizIndex]: option }));
    const isRight = option === currentQuiz.correct;
    if (isRight) {
      playSuccessSound();
    } else {
      playClickSound();
    }

    const shouldAutoAdvance =
      !studySettings.instantAnswer || (studySettings.autoAdvance && isRight);
    if (shouldAutoAdvance) {
      const delay = studySettings.instantAnswer ? 1200 : 280;
      quizTimerRef.current = setTimeout(() => {
        if (quizIndex < quizQuestions.length - 1) {
          setQuizIndex((prev) => prev + 1);
        } else {
          setQuizFinished(true);
        }
      }, delay);
    }
  };

  const handlePrevQuiz = () => {
    if (quizIndex <= 0) return;
    clearQuizTimer();
    playClickSound();
    setQuizIndex((prev) => prev - 1);
  };

  const handleNextQuiz = () => {
    clearQuizTimer();
    playClickSound();
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    clearQuizTimer();
    playClickSound();
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizFinished(false);
    setQuizSeed((s) => s + 1);
  };

  // --- CHẾ ĐỘ 3: GÕ TỪ (TYPING PRACTICE) ---
  const currentTypingWord = vocabularies[typingIndex];
  const isTypingEnToVi = useMemo(() => {
    if (!currentTypingWord) return true;
    return isWordEnToVi(studySettings.direction, `type-${currentTypingWord._id}-${typingIndex}`);
  }, [studySettings.direction, currentTypingWord, typingIndex]);

  useEffect(() => {
    if (
      viewMode === "typing" &&
      !typingFinished &&
      studySettings.autoAudio &&
      !isTypingEnToVi &&
      currentTypingWord?.word
    ) {
      speakText(currentTypingWord.word).catch(() => {});
    }
  }, [viewMode, typingFinished, studySettings.autoAudio, isTypingEnToVi, typingIndex, currentTypingWord?.word]);

  const handleCheckTyping = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentTypingWord || typingStatus !== "idle") return;
    clearTypingTimer();

    const target = isTypingEnToVi
      ? currentTypingWord.word.trim().toLowerCase()
      : currentTypingWord.meaning.trim().toLowerCase();
    const answer = typingInput.trim().toLowerCase();
    if (!answer) return;

    const isRight = answer === target;
    if (isRight) {
      playSuccessSound();
      setTypingStatus("correct");
      setTypingScore((prev) => prev + 1);
      if (studySettings.autoAudio) {
        speakText(currentTypingWord.word).catch(() => {});
      }
    } else {
      playClickSound();
      setTypingStatus("wrong");
    }

    const shouldAutoAdvance =
      !studySettings.instantAnswer || (studySettings.autoAdvance && isRight);
    if (shouldAutoAdvance) {
      const delay = studySettings.instantAnswer ? 1200 : 280;
      typingTimerRef.current = setTimeout(() => {
        if (typingIndex < vocabularies.length - 1) {
          setTypingIndex((prev) => prev + 1);
          setTypingInput("");
          setTypingStatus("idle");
          setTypingShowHint(false);
        } else {
          setTypingFinished(true);
        }
      }, delay);
    }
  };

  const handleNextTyping = () => {
    clearTypingTimer();
    playClickSound();
    if (typingIndex < vocabularies.length - 1) {
      setTypingIndex((prev) => prev + 1);
      setTypingInput("");
      setTypingStatus("idle");
      setTypingShowHint(false);
    } else {
      setTypingFinished(true);
    }
  };

  const handleRestartTyping = () => {
    clearTypingTimer();
    playClickSound();
    setTypingIndex(0);
    setTypingInput("");
    setTypingStatus("idle");
    setTypingScore(0);
    setTypingFinished(false);
    setTypingShowHint(false);
  };

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
    setAddModalTab("single");
    setJsonInput("");
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

  // Đọc file .json từ máy tính
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = typeof event.target?.result === "string" ? event.target.result : "";
      setJsonInput(content);
      setAuthoringError(null);
      playClickSound();
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // Submit nhập hàng loạt từ vựng bằng JSON
  const handleBulkImportJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic?._id) return;
    if (parsedJsonPreview.error || parsedJsonPreview.items.length === 0) {
      setAuthoringError(
        parsedJsonPreview.error || "Vui lòng dán nội dung JSON hoặc tải lên file .json hợp lệ!"
      );
      return;
    }

    try {
      setIsAuthoringSubmitting(true);
      setAuthoringError(null);

      const res = await fetchApi<{ insertedCount: number; vocabularies: Vocabulary[] }>(
        "/vocabularies/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            topicId: topic._id,
            items: parsedJsonPreview.items,
          }),
        }
      );

      if (res.success && res.data) {
        playSuccessSound();
        const added = Array.isArray(res.data.vocabularies) ? res.data.vocabularies : [];
        const count = res.data.insertedCount ?? added.length;
        setAuthoringSuccess(`Đã nhập thành công ${count} từ vựng từ dữ liệu JSON!`);
        setShowAddWordModal(false);
        setJsonInput("");
        setVocabularies((prev) => [...prev, ...added]);
        setTopic((prev) => (prev ? { ...prev, wordCount: prev.wordCount + count } : prev));
      } else {
        setAuthoringError(res.message || "Không thể nhập từ vựng từ JSON. Vui lòng thử lại!");
      }
    } catch (err: any) {
      console.error("Lỗi khi import JSON từ vựng:", err);
      setAuthoringError(err.message || "Nhập JSON thất bại. Vui lòng kiểm tra định dạng dữ liệu!");
    } finally {
      setIsAuthoringSubmitting(false);
    }
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

  const parentClassId =
    topic.vocabClassId && typeof topic.vocabClassId === "object"
      ? topic.vocabClassId._id
      : typeof topic.vocabClassId === "string"
      ? topic.vocabClassId
      : null;
  const parentClassName =
    topic.vocabClassId && typeof topic.vocabClassId === "object"
      ? topic.vocabClassId.name
      : null;
  const backHref = parentClassId ? `/topics/classes/${parentClassId}` : "/topics";
  const backLabel = parentClassName ? `Quay lại lớp ${parentClassName}` : "Quay lại danh sách lớp";

  return (
    <AppLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col gap-6">
        {!(viewMode === "quiz" && vocabularies.length > 0 && !quizFinished) && (
          <>
            {/* Breadcrumb & Navigation Back */}
            <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            onClick={() => playClickSound()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-2xs transition"
          >
            <ChevronLeft className="size-4" /> {backLabel}
          </Link>

          {/* Action Row: 4-Mode Switcher + Study Settings + Teacher Add Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs gap-1">
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("flashcard");
                }}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "flashcard"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Layers className="size-3.5" /> 1. Học Từ
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("quiz");
                }}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "quiz"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Target className="size-3.5" /> 2. Quiz ABCD
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("typing");
                }}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "typing"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Keyboard className="size-3.5" /> 3. Gõ Từ
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode("list");
                }}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-slate-800 dark:bg-slate-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <List className="size-3.5" /> Danh sách ({vocabularies.length})
              </button>
            </div>

            {/* Study Settings Button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowStudySettingsModal(true);
              }}
              className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:border-emerald-500 transition cursor-pointer"
              title="Cài đặt phiên học"
            >
              <Settings className="size-3.5 text-emerald-600" />
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                {getDirectionBadgeLabel(studySettings.direction)}
              </span>
            </button>

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
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Lesson Header Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Bài {topic.lessonNumber || 1}
              </span>
              {topic.tag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {topic.tag}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-extrabold">{topic.title}</h1>
            </div>
            {topic.description && (
              <p className="text-xs text-slate-500 max-w-xl">{topic.description}</p>
            )}
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
          </>
        )}

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
                    {/* FRONT SIDE (respects ANH->VIỆT or VIỆT->ANH) */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col justify-between items-center text-center backface-hidden">
                      <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold tracking-wider">
                          {isFlashcardEnToVi
                            ? "Mặt trước: Tiếng Anh"
                            : "Mặt trước: Tiếng Việt"}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold uppercase">
                          {currentWord?.partOfSpeech || "noun"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
                          {isFlashcardEnToVi
                            ? currentWord?.word
                            : currentWord?.meaning}
                        </h2>

                        {isFlashcardEnToVi && currentWord?.phonetic && (
                          <span className="text-base sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
                            {currentWord.phonetic}
                          </span>
                        )}

                        {isFlashcardEnToVi && (
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
                        )}
                      </div>

                      <div className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-400">
                        <RotateCw className="size-3" />
                        <span>
                          {isFlashcardEnToVi
                            ? "Chạm để lật xem nghĩa tiếng Việt"
                            : "Chạm để lật xem từ tiếng Anh & phát âm"}
                        </span>
                      </div>
                    </div>

                    {/* BACK SIDE */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl p-8 flex flex-col justify-between items-center text-center rotate-y-180 backface-hidden">
                      <div className="w-full flex items-center justify-between text-xs font-semibold text-emerald-100">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] uppercase font-bold tracking-wider">
                          Mặt sau: Đáp án &amp; Ví dụ
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold uppercase">
                          {currentWord?.partOfSpeech}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3 max-w-md">
                        <span className="text-xs text-emerald-200 uppercase font-bold tracking-wider">
                          {isFlashcardEnToVi
                            ? "Ý nghĩa tiếng Việt"
                            : "Từ vựng tiếng Anh"}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black drop-shadow-sm leading-snug">
                          {isFlashcardEnToVi
                            ? currentWord?.meaning
                            : currentWord?.word}
                        </h3>
                        {!isFlashcardEnToVi && currentWord?.phonetic && (
                          <span className="text-sm font-mono text-emerald-100">
                            {currentWord.phonetic}
                          </span>
                        )}

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

        {/* VIEW MODE 2: QUIZ ABCD */}
        {viewMode === "quiz" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
            {vocabularies.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 w-full max-w-2xl flex flex-col items-center gap-3">
                <Target className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">
                  Bài học này chưa có từ vựng để tạo Quiz ABCD.
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-4" /> Thêm từ vựng ngay
                  </button>
                )}
              </div>
            ) : quizFinished ? (
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center shadow-lg flex flex-col items-center gap-5">
                <div className="size-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Trophy className="size-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">Hoàn thành Quiz ABCD!</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Bạn đã trả lời đúng{" "}
                    <strong className="text-emerald-600">
                      {quizScore}/{quizQuestions.length}
                    </strong>{" "}
                    câu hỏi ({Math.round((quizScore / quizQuestions.length) * 100)}%).
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRestartQuiz}
                    className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Làm lại Quiz ABCD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setViewMode("typing");
                    }}
                    className="h-11 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Chuyển sang 3. Gõ Từ
                  </button>
                </div>
              </div>
            ) : currentQuiz ? (
              <div className="w-full flex flex-col gap-5 py-2">
                {/* Distraction-free Quiz Top Bar */}
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={backHref}
                    onClick={() => playClickSound()}
                    className="h-10 px-4 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Thoát</span>
                  </Link>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      Câu {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 text-xs font-extrabold tabular-nums">
                      {Math.round(((quizIndex + 1) / quizQuestions.length) * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowStudySettingsModal(true);
                      }}
                      className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Settings className="size-3.5 text-emerald-500" />
                      <span>Cài đặt</span>
                    </button>
                  </div>
                </div>

                {/* Thin Emerald Progress Bar */}
                <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(((quizIndex + 1) / quizQuestions.length) * 100)}%`,
                    }}
                  />
                </div>

                {/* Large Centered Question Card */}
                <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center gap-3 pt-1">
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {currentQuiz.isEnToVi
                        ? "CHỌN NGHĨA TIẾNG VIỆT CHÍNH XÁC"
                        : "CHỌN TỪ TIẾNG ANH CHÍNH XÁC"}
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug max-w-2xl">
                      {currentQuiz.prompt}
                    </h2>

                    <div className="flex flex-col items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handlePronounce(currentQuiz.vocab.word)}
                        aria-label="Nghe phát âm tiếng Anh"
                        className="w-10 h-10 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-500 flex items-center justify-center transition cursor-pointer"
                      >
                        <Volume2 className="size-5" />
                      </button>

                      {currentQuiz.phonetic && (
                        <span className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {currentQuiz.phonetic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2x2 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                    {currentQuiz.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isPicked = quizSelectedOption === opt;
                      const isCorrect = opt === currentQuiz.correct;
                      const showFeedback =
                        studySettings.instantAnswer && quizSelectedOption !== null;

                      let btnStyle =
                        "bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-800 dark:text-slate-100";
                      let badgeStyle =
                        "bg-slate-100 dark:bg-slate-900 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300";

                      if (showFeedback) {
                        if (isCorrect) {
                          btnStyle =
                            "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20";
                          badgeStyle =
                            "bg-emerald-500 border-emerald-500 text-white";
                        } else if (isPicked && !isCorrect) {
                          btnStyle =
                            "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-200";
                          badgeStyle =
                            "bg-rose-500 border-rose-500 text-white";
                        }
                      } else if (isPicked) {
                        btnStyle =
                          "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200";
                        badgeStyle =
                          "bg-emerald-500 border-emerald-500 text-white";
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizSelectedOption !== null}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`min-h-[56px] px-4 py-3.5 rounded-2xl border text-left text-sm font-bold flex items-center gap-3.5 shadow-2xs transition cursor-pointer ${btnStyle}`}
                        >
                          <span
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 transition ${badgeStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant explanation & example when answered */}
                  {studySettings.instantAnswer && quizSelectedOption !== null && (
                    <div
                      className={`rounded-2xl p-4 border text-xs sm:text-sm flex flex-col gap-1 ${
                        quizSelectedOption === currentQuiz.correct
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200"
                          : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200"
                      }`}
                    >
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span>
                          {quizSelectedOption === currentQuiz.correct
                            ? "Chính xác!"
                            : `Chưa đúng! Đáp án đúng: ${currentQuiz.correct}`}
                        </span>
                        <span className="text-[11px] uppercase px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60">
                          {currentQuiz.partOfSpeech}
                        </span>
                      </div>
                      {currentQuiz.vocab.exampleSentence && (
                        <p className="text-xs opacity-90 mt-1">
                          <strong>Ví dụ:</strong> {currentQuiz.vocab.exampleSentence}
                          {currentQuiz.vocab.exampleMeaning
                            ? ` — ${currentQuiz.vocab.exampleMeaning}`
                            : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Navigation Bar */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handlePrevQuiz}
                    disabled={quizIndex === 0}
                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Câu Trước</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuiz}
                    className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-500/25 inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>
                      {quizIndex < quizQuestions.length - 1 ? "Câu Tiếp" : "Hoàn Thành"}
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW MODE 3: GÕ TỪ (TYPING PRACTICE) */}
        {viewMode === "typing" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            {vocabularies.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 w-full flex flex-col items-center gap-3">
                <Keyboard className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">
                  Bài học này chưa có từ vựng để luyện Gõ Từ.
                </p>
              </div>
            ) : typingFinished ? (
              <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center shadow-lg flex flex-col items-center gap-5">
                <div className="size-20 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <Trophy className="size-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">Hoàn thành Luyện Gõ Từ!</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Bạn gõ chính xác{" "}
                    <strong className="text-emerald-600">
                      {typingScore}/{vocabularies.length}
                    </strong>{" "}
                    từ vựng ({Math.round((typingScore / vocabularies.length) * 100)}%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestartTyping}
                  className="h-11 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Luyện gõ lại từ đầu
                </button>
              </div>
            ) : currentTypingWord ? (
              <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md flex flex-col gap-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Từ {typingIndex + 1} / {vocabularies.length}
                  </span>
                  <span className="text-emerald-600">Chính xác: {typingScore}</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{
                      width: `${Math.round(((typingIndex + 1) / vocabularies.length) * 100)}%`,
                    }}
                  />
                </div>

                <div className="py-3 text-center flex flex-col items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-[10px] font-bold uppercase">
                    {currentTypingWord.partOfSpeech}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                    {isTypingEnToVi
                      ? currentTypingWord.meaning
                      : currentTypingWord.word}
                  </h2>
                  {currentTypingWord.exampleMeaning && isTypingEnToVi && (
                    <p className="text-xs text-slate-500 italic max-w-md">
                      &quot;{currentTypingWord.exampleMeaning}&quot;
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handlePronounce(currentTypingWord.word)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Volume2 className="size-3.5 text-emerald-600" /> Nghe phát âm
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setTypingShowHint(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
                    >
                      <HelpCircle className="size-3.5" /> Gợi ý
                    </button>
                  </div>

                  {typingShowHint && (
                    <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                      Gợi ý:{" "}
                      {isTypingEnToVi
                        ? `${currentTypingWord.word[0]}${"_".repeat(
                            Math.max(1, currentTypingWord.word.length - 1)
                          )} (${currentTypingWord.word.length} ký tự)`
                        : `${currentTypingWord.meaning.slice(0, 6)}...`}
                    </span>
                  )}
                </div>

                <form onSubmit={handleCheckTyping} className="flex flex-col gap-3">
                  <input
                    type="text"
                    autoFocus
                    disabled={typingStatus !== "idle"}
                    placeholder={
                      isTypingEnToVi
                        ? "Nhập từ tiếng Anh chính xác..."
                        : "Nhập nghĩa tiếng Việt..."
                    }
                    value={typingInput}
                    onChange={(e) => setTypingInput(e.target.value)}
                    className={`h-12 px-4 rounded-2xl border text-sm font-bold focus:outline-none transition ${
                      typingStatus === "correct"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200"
                        : typingStatus === "wrong"
                        ? "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    }`}
                  />

                  {studySettings.instantAnswer && typingStatus !== "idle" && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                        typingStatus === "correct"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      <span>
                        {typingStatus === "correct"
                          ? "Chính xác tuyệt đối!"
                          : `Chưa đúng! Đáp án: ${
                              isTypingEnToVi
                                ? currentTypingWord.word
                                : currentTypingWord.meaning
                            }`}
                      </span>
                      {currentTypingWord.phonetic && (
                        <span className="font-mono">{currentTypingWord.phonetic}</span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {typingStatus === "idle" ? (
                      <button
                        type="submit"
                        disabled={!typingInput.trim()}
                        className="h-10.5 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition"
                      >
                        Kiểm tra đáp án
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextTyping}
                        className="h-10.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          {typingIndex < vocabularies.length - 1 ? "Từ tiếp theo" : "Xem kết quả"}
                        </span>
                        <ArrowRight className="size-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW MODE 4: VOCABULARY LIST TABLE */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {/* Search within topic (Clean & Dedicated Search Bar) */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                id="search-vocab"
                type="text"
                placeholder="Tra từ hoặc nghĩa tiếng Việt trong chủ đề..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-9 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition text-slate-900 dark:text-slate-100 shadow-xs"
              />
              {listSearch && (
                <button
                  type="button"
                  onClick={() => setListSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Condition 1: Chủ đề thực sự chưa có từ nào */}
            {vocabularies.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
                <BookOpen className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">
                  Chủ đề này chưa có thẻ từ vựng nào.
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Plus className="size-4 stroke-[3]" />
                    <span>Soạn từ vựng đầu tiên</span>
                  </button>
                )}
              </div>
            ) : filteredVocabularies.length === 0 ? (
              /* Condition 2: Chủ đề có từ nhưng tìm kiếm không khớp */
              <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center gap-3">
                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Search className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Không tìm thấy từ vựng nào
                  </h4>
                  <p className="text-xs text-slate-500">
                    Không có từ vựng nào khớp với từ khóa &quot;{listSearch}&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setListSearch("")}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
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

        {/* MODAL: THÊM TỪ VỰNG MỚI (HỖ TRỢ NHẬP TỪNG TỪ & NHẬP HÀNG LOẠT BẰNG JSON) */}
        {showAddWordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    {addModalTab === "json" ? (
                      <FileJson className="size-5" />
                    ) : (
                      <Plus className="size-5 stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Thêm Từ Vựng Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bài {topic.lessonNumber || 1}:{" "}
                      <span className="font-semibold text-emerald-600">{topic.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* CHUYỂN CHẾ ĐỘ: NHẬP TỪNG TỪ / NHẬP HÀNG LOẠT BẰNG JSON */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setAuthoringError(null);
                    setAddModalTab("single");
                  }}
                  className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    addModalTab === "single"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Plus className="size-3.5" />
                  Nhập từng từ (Form)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setAuthoringError(null);
                    setAddModalTab("json");
                  }}
                  className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    addModalTab === "json"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileJson className="size-3.5" />
                  Nhập hàng loạt bằng JSON
                </button>
              </div>

              {authoringError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {authoringError}
                </div>
              )}

              {addModalTab === "single" ? (
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
              ) : (
                <form onSubmit={handleBulkImportJson} className="flex flex-col gap-4">
                  {/* Thanh công cụ JSON: Tải file .json hoặc chèn JSON mẫu */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/70">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Hỗ trợ mảng JSON các đối tượng có trường <code className="font-bold text-emerald-600 dark:text-emerald-400">word</code> &amp; <code className="font-bold text-emerald-600 dark:text-emerald-400">meaning</code> (tối đa 200 từ/lần).
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
                        <Upload className="size-3.5 text-emerald-600" />
                        <span>Chọn file .json</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleJsonFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setJsonInput(SAMPLE_JSON_TEMPLATE);
                          setAuthoringError(null);
                        }}
                        className="h-8.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
                      >
                        Chèn JSON mẫu
                      </button>
                    </div>
                  </div>

                  {/* Khung nhập JSON */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nội dung JSON <span className="text-rose-500">*</span>
                      </label>
                      {jsonInput.trim() && (
                        <button
                          type="button"
                          onClick={() => setJsonInput("")}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          Xóa trắng
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={8}
                      spellCheck={false}
                      placeholder={SAMPLE_JSON_TEMPLATE}
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="p-3.5 rounded-2xl bg-slate-950 text-emerald-300 border border-slate-800 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                    />
                  </div>

                  {/* Trạng thái kiểm tra & xem trước JSON */}
                  {jsonInput.trim() && parsedJsonPreview.error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                      {parsedJsonPreview.error}
                    </div>
                  )}

                  {!parsedJsonPreview.error && parsedJsonPreview.items.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-4" />
                          JSON hợp lệ! Sẵn sàng nhập {parsedJsonPreview.items.length} từ vựng
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/70">
                          Xem trước
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {parsedJsonPreview.items.slice(0, 6).map((item, idx) => (
                          <div
                            key={`${item.word}-${idx}`}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 flex flex-col gap-0.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                {item.word}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 shrink-0">
                                {item.partOfSpeech}
                              </span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 truncate">
                              {item.meaning}
                            </span>
                          </div>
                        ))}
                      </div>
                      {parsedJsonPreview.items.length > 6 && (
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                          ... và {parsedJsonPreview.items.length - 6} từ vựng khác.
                        </p>
                      )}
                    </div>
                  )}

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
                      disabled={
                        isAuthoringSubmitting ||
                        !!parsedJsonPreview.error ||
                        parsedJsonPreview.items.length === 0
                      }
                      className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer"
                    >
                      <FileJson className="size-3.5" />
                      {isAuthoringSubmitting
                        ? "Đang nhập JSON..."
                        : `Import ${parsedJsonPreview.items.length || ""} từ vựng`}
                    </button>
                  </div>
                </form>
              )}
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

        {/* MODAL: CÀI ĐẶT PHIÊN HỌC */}
        <StudySettingsModal
          isOpen={showStudySettingsModal}
          onClose={() => setShowStudySettingsModal(false)}
          settings={studySettings}
          onChange={updateStudySettings}
        />
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
