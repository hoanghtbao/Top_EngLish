/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Giao diện làm bài thi trắc nghiệm bấm giờ, nộp bài tự động chấm điểm và màn hình xem lại lời giải chi tiết
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
  Award,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Clock,
  GraduationCap,
  HelpCircle,
  RotateCw,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { useAuth } from "../../../context/auth-context";
import { fetchApi } from "../../../lib/api-client";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  type: "vocabulary" | "grammar" | "general";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  durationMinutes: number;
  passingScore: number;
  totalQuestions: number;
}

interface Question {
  _id: string;
  quizId: string;
  questionText: string;
  type: "multiple_choice" | "fill_in_the_blank";
  options: string[];
  order: number;
}

interface GradedAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface SubmissionResult {
  _id: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  xpEarned: number;
  answers: GradedAnswer[];
}

function QuizTakingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex">
      <div className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen shrink-0" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80" />
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Đang nạp đề thi và cấu hình câu hỏi...
          </p>
        </div>
      </div>
    </div>
  );
}

function QuizTakingInner() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;
  const { user, isAuthenticated, updateStreakInfo } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Trạng thái làm bài
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Tải đề thi và câu hỏi
  useEffect(() => {
    if (!quizId) return;

    const loadQuizData = async () => {
      setLoading(true);
      try {
        const [quizRes, qRes] = await Promise.all([
          fetchApi<Quiz>(`/quizzes/${quizId}`),
          fetchApi<Question[]>(`/quizzes/${quizId}/questions`),
        ]);

        if (quizRes.success && quizRes.data) {
          setQuiz(quizRes.data);
          setTimeLeft(quizRes.data.durationMinutes * 60);
        }

        if (qRes.success && Array.isArray(qRes.data)) {
          setQuestions(qRes.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải đề thi:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId]);

  // Bộ đếm ngược thời gian làm bài (Timer Countdown)
  useEffect(() => {
    if (loading || submissionResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submissionResult, timeLeft]);

  const handleSelectOption = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!quiz || questions.length === 0) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: userAnswers[q._id] || "",
      }));

      const res = await fetchApi<SubmissionResult>(`/quizzes/${quiz._id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (res.success && res.data) {
        setSubmissionResult(res.data);
        if (updateStreakInfo) {
          updateStreakInfo({
            streak: (res.data as any).streak,
            totalXP: (res.data as any).totalXP,
            xpEarned: (res.data as any).xpEarned,
            streakIncreased: (res.data as any).streakIncreased,
            isNewStreakDay: (res.data as any).isNewStreakDay,
            streakMessage: (res.data as any).streakMessage,
          });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Lỗi nộp bài thi:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <QuizTakingSkeleton />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Không tìm thấy đề thi</h2>
          <p className="text-xs text-slate-500">
            Đề thi này không tồn tại hoặc chưa có câu hỏi nào.
          </p>
          <Link
            href="/quizzes"
            className="h-11 px-5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Quay lại danh mục đề thi
          </Link>
        </div>
      </AppLayout>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] && userAnswers[k].trim() !== ""
  ).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  // MÀN HÌNH XEM KẾT QUẢ ĐÃ CHẤM ĐIỂM
  if (submissionResult) {
    return (
      <AppLayout>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full flex flex-col gap-8">
          {/* Result Score Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-lg flex flex-col items-center text-center gap-5">
            <div
              className={`size-20 rounded-3xl flex items-center justify-center shadow-inner ${
                submissionResult.passed
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-500"
              }`}
            >
              {submissionResult.passed ? (
                <Trophy className="size-10" />
              ) : (
                <Award className="size-10" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black self-center uppercase ${
                  submissionResult.passed
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {submissionResult.passed ? "🎉 Đạt yêu cầu bài thi" : "Cần ôn tập thêm"}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black">
                {submissionResult.passed
                  ? "Chúc mừng bạn đã hoàn thành xuất sắc!"
                  : "Bạn chưa đạt điểm tối thiểu"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {submissionResult.passed
                  ? `Bạn đã đạt ${submissionResult.score}% (Điểm yêu cầu: ${quiz.passingScore}%). Điểm kinh nghiệm đã được cộng vào tài khoản!`
                  : `Bạn đạt ${submissionResult.score}% trong khi điểm yêu cầu là ${quiz.passingScore}%. Hãy xem lại lời giải chi tiết và thử lại nhé!`}
              </p>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md py-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                  Điểm số
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {submissionResult.score}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                  Câu đúng
                </span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {submissionResult.correctCount}/{submissionResult.totalQuestions}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                  Thưởng XP
                </span>
                <span className="text-2xl font-black text-amber-500">
                  +{submissionResult.xpEarned} XP
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setUserAnswers({});
                  setCurrentIdx(0);
                  setTimeLeft(quiz.durationMinutes * 60);
                }}
                className="h-11 px-6 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCw className="size-4" /> Làm lại bài thi này
              </button>
              <Link
                href="/quizzes"
                className="h-11 px-6 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-2"
              >
                Khám phá đề thi khác
              </Link>
            </div>
          </div>

          {/* Detailed Question Review Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <CheckSquare className="size-5 text-emerald-600" /> Xem lại đáp án & Giải thích chi tiết
            </h2>

            <div className="flex flex-col gap-4">
              {submissionResult.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl border shadow-xs flex flex-col gap-3 transition-colors ${
                    ans.isCorrect
                      ? "bg-white dark:bg-slate-900 border-emerald-500/40"
                      : "bg-white dark:bg-slate-900 border-rose-500/40"
                  }`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">
                      Câu {idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ans.isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                      }`}
                    >
                      {ans.isCorrect ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> Đúng (+10 XP)
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3.5" /> Sai
                        </>
                      )}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                    {ans.questionText}
                  </h3>

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Câu trả lời của bạn:
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          ans.isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {ans.selectedAnswer || "(Chưa chọn đáp án)"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        Đáp án chính xác:
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
                        {ans.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* Explanation Card */}
                  {ans.explanation && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <HelpCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 dark:text-white block mb-0.5">
                          Giải thích đáp án:
                        </strong>
                        <p className="leading-relaxed">{ans.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // MÀN HÌNH LÀM BÀI THI TƯƠNG TÁC
  return (
    <AppLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full flex flex-col gap-6">
        {/* Top Control Bar: Title & Live Timer */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/quizzes"
              className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-emerald-600 transition"
              title="Thoát bài thi"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  CEFR {quiz.level}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">
                  {quiz.type}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold truncate max-w-sm sm:max-w-md">
                {quiz.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black ${
                timeLeft <= 60
                  ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:border-rose-800 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Clock className="size-4" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Quick Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>

        {/* Question Progress Bar & Question Number Pills */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Đã trả lời {answeredCount} / {questions.length} câu hỏi
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              {progressPercent}% hoàn thành
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick Question Jump Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {questions.map((q, idx) => {
              const isAnswered =
                userAnswers[q._id] && userAnswers[q._id].trim() !== "";
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`size-9 rounded-xl text-xs font-black transition cursor-pointer shrink-0 flex items-center justify-center ${
                    isCurrent
                      ? "ring-2 ring-emerald-500 ring-offset-2 bg-emerald-600 text-white shadow-sm"
                      : isAnswered
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Question Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Câu {currentIdx + 1} / {questions.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentQ.type === "multiple_choice"
                ? "Chọn 1 đáp án đúng"
                : "Điền từ thích hợp"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.questionText}
          </h2>

          {/* Render Options: Multiple Choice */}
          {currentQ.type === "multiple_choice" ? (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentQ._id] === opt;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ._id, opt)}
                    className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <span
                      className={`size-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Render Input: Fill in the blank */
            <div className="pt-2 flex flex-col gap-2">
              <label htmlFor="fill-answer" className="text-xs font-bold text-slate-500">
                Nhập câu trả lời của bạn:
              </label>
              <input
                id="fill-answer"
                type="text"
                placeholder="Gõ từ hoặc cụm từ..."
                value={userAnswers[currentQ._id] || ""}
                onChange={(e) => handleSelectOption(currentQ._id, e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-900 dark:text-slate-100 transition"
              />
            </div>
          )}

          {/* Navigation Controls between questions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="h-11 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Câu trước</span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="h-11 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="h-11 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="size-4" />
                <span>Nộp bài thi</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal before submitting */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-scale-in">
              <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <HelpCircle className="size-6" />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">Xác nhận nộp bài thi?</h3>
                <p className="text-xs text-slate-500">
                  Bạn đã trả lời <strong>{answeredCount} / {questions.length}</strong> câu hỏi. Hệ thống sẽ ngay lập tức chấm điểm và cập nhật kết quả vào hồ sơ học viên.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="h-11 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Làm tiếp
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAnswers}
                  disabled={isSubmitting}
                  className="h-11 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Đang chấm điểm..." : "Nộp bài ngay"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}

export default function QuizTakingPage() {
  return (
    <Suspense fallback={<QuizTakingSkeleton />}>
      <QuizTakingInner />
    </Suspense>
  );
}
