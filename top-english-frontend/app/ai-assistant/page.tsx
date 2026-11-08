/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Trợ lý Trí tuệ Nhân tạo AI (AI Learning Assistant) tuân thủ tiêu chuẩn UI/UX Pro Max và Shadcn UI
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Copy,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  PenTool,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { fetchApi } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

// ==========================================
// INTERFACES & TYPES
// ==========================================

interface GrammarIssue {
  type: string;
  originalPart: string;
  suggestion: string;
  description: string;
}

interface GrammarResult {
  originalText: string;
  correctedText: string;
  hasErrors: boolean;
  naturalnessScore: number;
  issues: GrammarIssue[];
  explanation: string;
  alternativeExpressions: string[];
}

interface WordExplainResult {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  vietnameseMeaning: string;
  englishDefinition: string;
  cefrLevel: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  examples: Array<{ sentence: string; translation: string }>;
  memoryTip: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: string;
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"grammar" | "word" | "chat">("grammar");

  // State: Tab 1 - Grammar
  const [grammarInput, setGrammarInput] = useState("");
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // State: Tab 2 - Word Deep Dive
  const [wordInput, setWordInput] = useState("");
  const [wordContext, setWordContext] = useState("");
  const [wordLoading, setWordLoading] = useState(false);
  const [wordResult, setWordResult] = useState<WordExplainResult | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);

  // State: Tab 3 - Chat AI
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Xin chào! Mình là Gia sư Tiếng Anh AI của TopEnglish 🌟. Mình luôn sẵn sàng giải đáp thắc mắc ngữ pháp, sửa câu, phân tích từ vựng và gợi ý phương pháp học cho bạn. Bạn muốn luyện tập điều gì hôm nay?",
      suggestions: [
        "Phân biệt cách dùng In, On và At",
        "Phân biệt Listen và Hear",
        "Cách dùng thì Hiện tại hoàn thành",
        "Mẹo học từ vựng nhớ lâu với Spaced Repetition",
      ],
      timestamp: "Vừa xong",
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Phát âm tiếng Anh chuẩn bằng Web Speech API
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy đoạn văn bản vào Clipboard
  const copyToClipboard = (text: string, index = 0) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCheckGrammar = async (textToCheck?: string) => {
    const text = (textToCheck || grammarInput).trim();
    if (!text) return;

    setGrammarLoading(true);
    setGrammarError(null);

    try {
      const res = await fetchApi<GrammarResult>("/ai/check-grammar", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      if (res.success && res.data) {
        setGrammarResult(res.data);
      } else {
        setGrammarError(res.message || "Không thể kiểm tra câu lúc này");
      }
    } catch {
      setGrammarError("Đã có lỗi xảy ra khi kết nối tới Trợ lý AI.");
    } finally {
      setGrammarLoading(false);
    }
  };

  const handleExplainWord = async (searchWord?: string) => {
    const word = (searchWord || wordInput).trim();
    if (!word) return;

    setWordLoading(true);
    setWordError(null);

    try {
      const res = await fetchApi<WordExplainResult>("/ai/explain-word", {
        method: "POST",
        body: JSON.stringify({ word, context: wordContext.trim() || undefined }),
      });

      if (res.success && res.data) {
        setWordResult(res.data);
      } else {
        setWordError(res.message || "Không thể tra cứu từ vựng này");
      }
    } catch {
      setWordError("Đã có lỗi xảy ra khi kết nối tới Trợ lý AI.");
    } finally {
      setWordLoading(false);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const message = (customMessage || chatInput).trim();
    if (!message || chatLoading) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const historyPayload = chatMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetchApi<{ reply: string; suggestions?: string[] }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message, history: historyPayload }),
      });

      if (res.success && res.data) {
        const assistantMessage: ChatMessage = {
          id: String(Date.now() + 1),
          role: "assistant",
          content: res.data.reply,
          suggestions: res.data.suggestions,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Xin lỗi, đường truyền hiện tại bị gián đoạn. Bạn thử gửi lại tin nhắn nhé!",
        timestamp: "Vừa xong",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Mẫu câu test nhanh cho Tab 1
  const grammarSamples = [
    "She don't likes apple and listen music every days.",
    "I am agree with your opinion about this situation.",
    "He have been working in this company since 3 years.",
    "We will discuss about this important informations tomorrow.",
  ];

  // Mẫu từ vựng test nhanh cho Tab 2
  const wordSamples = ["Resilient", "Perseverance", "Eloquent", "Meticulous"];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl shadow-emerald-900/10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="size-8 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Trợ lý Trí tuệ Nhân tạo AI
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30 text-white backdrop-blur-md">
                  AI Trợ giảng 24/7
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
                Cố vấn học tập thông minh 24/7: Sửa lỗi ngữ pháp tức thì, mổ xẻ từ vựng chuyên sâu và giải đáp mọi thắc mắc của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100">
              <Bot className="size-4 text-emerald-300" />
              <span>Sẵn sàng hỗ trợ {user?.fullName ? `cho ${user.fullName}` : ""}</span>
            </span>
          </div>
        </div>

        {/* TAB BUTTONS (NAVIGATION) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("grammar")}
            className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "grammar"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <PenTool className="size-4 shrink-0" />
            <span>Sửa lỗi Ngữ pháp</span>
          </button>

          <button
            onClick={() => setActiveTab("word")}
            className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "word"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="size-4 shrink-0" />
            <span>Mổ xẻ Từ vựng</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "chat"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="size-4 shrink-0" />
            <span>Gia sư AI 24/7</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SỬA LỖI NGỮ PHÁP (GRAMMAR & SENTENCE POLISHING) */}
        {/* ============================================================== */}
        {activeTab === "grammar" && (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label
                  htmlFor="grammar-textarea"
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <PenTool className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Nhập câu hoặc đoạn văn tiếng Anh cần kiểm tra:</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {grammarInput.length}/1000 ký tự
                </span>
              </div>

              <textarea
                id="grammar-textarea"
                rows={4}
                value={grammarInput}
                onChange={(e) => setGrammarInput(e.target.value)}
                placeholder="Ví dụ: She don't likes apple and listen music every days..."
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition leading-relaxed"
              />

              {/* Mẫu câu kiểm thử nhanh */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400">
                  Thử nhanh với mẫu câu:
                </span>
                {grammarSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setGrammarInput(sample);
                      handleCheckGrammar(sample);
                    }}
                    className="min-h-[36px] py-1 px-2.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    "{sample.slice(0, 28)}..."
                  </button>
                ))}
              </div>

              {grammarError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{grammarError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGrammarInput("");
                    setGrammarResult(null);
                  }}
                  className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Đặt lại</span>
                </button>
                <button
                  type="button"
                  disabled={!grammarInput.trim() || grammarLoading}
                  onClick={() => handleCheckGrammar()}
                  className="min-h-[44px] px-6 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {grammarLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>AI đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      <span>Phân tích & Sửa câu</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* KẾT QUẢ SỬA CÂU CỦA AI */}
            {grammarResult && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Điểm số tự nhiên & Đánh giá tổng quan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        grammarResult.naturalnessScore >= 80
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                          : grammarResult.naturalnessScore >= 60
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {grammarResult.naturalnessScore}%
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {grammarResult.hasErrors
                          ? "Phát hiện điểm cần cải thiện"
                          : "Câu văn rất chuẩn xác!"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {grammarResult.explanation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                      grammarResult.hasErrors
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {grammarResult.hasErrors ? (
                      <>
                        <AlertCircle className="size-3.5" />
                        <span>{grammarResult.issues.length} lỗi cần sửa</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>Chuẩn ngữ pháp</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Câu đã sửa (Corrected Text) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Câu đã sửa chuẩn xác:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(grammarResult.correctedText)}
                        className="size-8 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
                        title="Nghe phát âm câu đã sửa"
                        aria-label="Phát âm câu đã sửa"
                      >
                        <Volume2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(grammarResult.correctedText, 100)}
                        className="size-8 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
                        title="Sao chép câu đã sửa"
                        aria-label="Sao chép câu"
                      >
                        {copiedIndex === 100 ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {grammarResult.correctedText}
                  </p>
                </div>

                {/* Danh sách các lỗi sai chi tiết (nếu có) */}
                {grammarResult.issues && grammarResult.issues.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Phân tích chi tiết từng lỗi sai:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {grammarResult.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {issue.type}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                              <span className="text-rose-500 line-through">
                                {issue.originalPart}
                              </span>
                              <ArrowRight className="size-3 text-slate-400" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {issue.suggestion}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {issue.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gợi ý cách diễn đạt nâng cao (B2/C1) */}
                {grammarResult.alternativeExpressions &&
                  grammarResult.alternativeExpressions.length > 0 && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="size-3.5 text-amber-500" />
                        Gợi ý diễn đạt nâng cao tự nhiên (B2 / C1):
                      </h3>
                      <div className="flex flex-col gap-2">
                        {grammarResult.alternativeExpressions.map((alt, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                          >
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium italic">
                              "{alt}"
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => speakText(alt)}
                                className="size-7 rounded-lg text-slate-400 hover:text-emerald-600 flex items-center justify-center transition cursor-pointer"
                                aria-label="Nghe phát âm"
                              >
                                <Volume2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(alt, idx + 1)}
                                className="size-7 rounded-lg text-slate-400 hover:text-emerald-600 flex items-center justify-center transition cursor-pointer"
                                aria-label="Sao chép"
                              >
                                {copiedIndex === idx + 1 ? (
                                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MỔ XẺ TỪ VỰNG CHUYÊN SÂU (WORD DEEP DIVE) */}
        {/* ============================================================== */}
        {activeTab === "word" && (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <label
                htmlFor="word-search-input"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Search className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Nhập từ vựng hoặc cụm từ tiếng Anh bạn muốn mổ xẻ:</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="word-search-input"
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExplainWord()}
                  placeholder="Ví dụ: Resilient, Perseverance, Eloquent..."
                  className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  disabled={!wordInput.trim() || wordLoading}
                  onClick={() => handleExplainWord()}
                  className="min-h-[44px] px-6 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {wordLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Đang tra cứu...</span>
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      <span>Mổ xẻ từ vựng</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ngữ cảnh câu tùy chọn */}
              <input
                type="text"
                value={wordContext}
                onChange={(e) => setWordContext(e.target.value)}
                placeholder="(Tùy chọn) Nhập câu văn chứa từ này để AI phân tích chính xác ngữ cảnh..."
                className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />

              {/* Từ mẫu gợi ý nhanh */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  Từ nổi bật gợi ý:
                </span>
                {wordSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setWordInput(sample);
                      handleExplainWord(sample);
                    }}
                    className="min-h-[36px] py-1 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {wordError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{wordError}</span>
                </div>
              )}
            </div>

            {/* KẾT QUẢ MỔ XẺ TỪ VỰNG */}
            {wordResult && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 animate-in fade-in duration-300">
                {/* Header từ vựng: Từ, Phiên âm, Cấp độ CEFR & Nghĩa tiếng Việt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => speakText(wordResult.word)}
                      className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center transition cursor-pointer shadow-sm group"
                      title="Bấm để nghe phát âm"
                      aria-label="Phát âm từ vựng"
                    >
                      <Volume2 className="size-7 group-hover:scale-110 transition" />
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {wordResult.word}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {wordResult.cefrLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {wordResult.phonetic}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs font-semibold text-slate-500 italic">
                          {wordResult.partOfSpeech}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nghĩa tiếng Việt
                    </span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      {wordResult.vietnameseMeaning}
                    </span>
                  </div>
                </div>

                {/* Định nghĩa tiếng Anh chuẩn */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Định nghĩa tiếng Anh (English Definition):
                  </span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {wordResult.englishDefinition}
                  </p>
                </div>

                {/* Từ đồng nghĩa, Trái nghĩa & Collocations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Synonyms */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Từ đồng nghĩa (Synonyms)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {wordResult.synonyms.map((syn, idx) => (
                        <span
                          key={idx}
                          onClick={() => {
                            setWordInput(syn);
                            handleExplainWord(syn);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Antonyms */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="size-3.5" /> Từ trái nghĩa (Antonyms)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {wordResult.antonyms.map((ant, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Collocations */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-2">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Layers className="size-3.5" /> Cụm từ hay gặp (Collocations)
                    </span>
                    <div className="flex flex-col gap-1">
                      {wordResult.collocations.map((col, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          • {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Các câu ví dụ song ngữ */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ví dụ câu thực tế (Real-world Examples):
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {wordResult.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                            "{ex.sentence}"
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {ex.translation}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakText(ex.sentence)}
                          className="size-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
                          aria-label="Nghe câu ví dụ"
                        >
                          <Volume2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mẹo ghi nhớ siêu tốc (Mnemonic Memory Tip) */}
                {wordResult.memoryTip && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                    <Lightbulb className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                        Mẹo ghi nhớ siêu tốc (Memory Tip):
                      </span>
                      <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-0.5 leading-relaxed">
                        {wordResult.memoryTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GIA SƯ AI TRỰC TUYẾN 24/7 (AI ENGLISH TUTOR CHAT) */}
        {/* ============================================================== */}
        {activeTab === "chat" && (
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[650px]">
            {/* Chat Messages Scrollable Box */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 no-scrollbar">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? (
                      user?.fullName ? (
                        user.fullName.slice(0, 2).toUpperCase()
                      ) : (
                        "ME"
                      )
                    ) : (
                      <Bot className="size-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/10"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Suggestion Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Câu hỏi gợi ý liên quan:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleSendMessage(sug)}
                              className="py-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-600 transition cursor-pointer text-left"
                            >
                              👉 {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <span
                      className={`block text-[10px] mt-2 text-right ${
                        msg.role === "user"
                          ? "text-emerald-200"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="size-5 text-white" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                    <span>Gia sư AI đang soạn câu trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi Gia sư AI bất kỳ điều gì về tiếng Anh..."
                className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="min-h-[48px] px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0 font-bold text-xs sm:text-sm"
                aria-label="Gửi tin nhắn"
              >
                <Send className="size-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
